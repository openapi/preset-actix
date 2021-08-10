import { FilesApi, Method, PresetConstructor, status } from 'openapi';
import { OpenAPIV3 } from 'openapi-types';
import * as changeCase from 'change-case';
import {
  DeriveSerde,
  HeaderExtractor,
  SchemasExtra,
  UseParentComponents,
  apiStruct,
  enumeration,
  headerStructure,
  mod,
  pathBind,
  pathModule,
  struct,
  typeToRust,
  vec,
} from './template';

const PACKAGE_NAME = 'openapi-preset-actix';

interface Options {
  fileName?: string;
}

class Components {
  private extras = new Set<string>();
  private components = new Map<string, string>();

  addExtra(extra: string) {
    this.extras.add(extra);
  }

  addComponent(name: string, component: string) {
    this.components.set(name, component);
  }

  hasItems() {
    return this.components.size !== 0;
  }

  build(): string {
    return [...this.extras, ...this.components.values()].join('');
  }
}

const preset: PresetConstructor<Options> = ({ fileName = 'generated.rs' } = {}, internal) => {
  const parameters = new Components();
  const schemas = new Components();

  function addHeader(name: string, header: string) {
    parameters.addExtra(HeaderExtractor);
    const struct = changeCase.pascalCase(name);
    parameters.addComponent(struct, headerStructure(struct, header));
  }

  function traverseSchema(name: string, schema: OpenAPIV3.SchemaObject): string {
    schemas.addExtra(SchemasExtra);

    if (isSchemaArray(schema)) {
      schemas.addExtra(UseParentComponents);
      const itemsType = internal.isRef(schema.items)
        ? refToRust(schema.items.$ref)
        : traverseSchema(`${name}_Item`, schema.items);

      schemas.addComponent(name, vec(name, itemsType));
    } else if (isSchemaNonArray(schema)) {
      let component = '';

      if (schema.type === 'string' && schema.enum) {
        component = enumeration(
          name,
          new Set(schema.enum),
          '#[derive(Debug, Serialize, Deserialize)]',
        );
      } else if (schema.type === 'object' && schema.properties) {
        const fields = new Map<string, string>();
        for (const [propName, type] of Object.entries(schema.properties)) {
          const optional = schema.required?.includes(propName) ?? false;
          const realType = internal.isRef(type)
            ? (schemas.addExtra(UseParentComponents), refToRust(type.$ref))
            : traverseSchema(`${name}_${propName}`, type);
          const content = optional ? `Option<${realType}>` : realType;

          fields.set(name, content);
        }
        component = struct(name, fields, DeriveSerde);
      } else {
        return typeToRust(schema.type ?? 'object');
      }

      schemas.addComponent(name, component);
    }
    return `components::schemas::${changeCase.pascalCase(name)}`;
  }

  const apiPaths = new Map<string, { api: string; path: string }>();

  return {
    name: PACKAGE_NAME,

    onParameter(name: string, parameter: OpenAPIV3.ParameterObject) {
      if (parameter.in === 'header') {
        addHeader(name, parameter.name);
      }
    },

    onSchema(name: string, schema: OpenAPIV3.SchemaObject) {
      traverseSchema(name, schema);
    },

    onOperation(pattern: string, method: Method, operation: OpenAPIV3.OperationObject) {
      const operationId = operation.operationId ?? pattern;
      const moduleName = changeCase.snakeCase(operationId);

      const responses = Object.entries(operation.responses ?? {}).map(([code, refOrResponse]) => {
        const response = internal.isRef(refOrResponse)
          ? (internal.resolveRef(refOrResponse.$ref) as OpenAPIV3.ResponseObject)
          : refOrResponse;

        const name = internal.isRef(refOrResponse)
          ? refOrResponse.$ref.split('/').pop()!
          : `${changeCase.pascalCase(operationId)}${changeCase.pascalCase(
              status[Number(code) as keyof typeof status]?.code ?? code,
            )}`;
        const contentType = response.content?.['application/json'] ? 'json' : undefined;

        return { code: parseInt(code, 10), contentType, name };
      });

      apiPaths.set(moduleName, {
        api: pathBind(operationId, pattern, method),
        path: pathModule(operationId, responses),
      });
    },

    build(files: FilesApi) {
      const chunks = [];

      chunks.push(
        mod(
          'api',
          apiStruct(
            internal.root().info.title,
            Array.from(apiPaths.values())
              .map((a) => a.api)
              .join(''),
          ),
        ),
      );

      chunks.push(
        mod(
          'paths',
          'use super::components::responses;' +
            Array.from(apiPaths.values())
              .map((a) => a.path)
              .join(''),
        ),
      );

      const components = new Set<string>();

      if (parameters.hasItems()) {
        components.add(mod('parameters', parameters.build()));
      }

      if (true) {
        components.add(mod('responses', [].join('')));
      }

      if (true) {
        components.add(mod('request_bodies', [].join('')));
      }

      if (schemas.hasItems()) {
        components.add(mod('schemas', schemas.build()));
      }

      if (components.size) {
        chunks.push(mod('components', Array.from(components).join('')));
      }

      files.addFile(
        fileName,
        '/// File auto generated by npmjs.com/' + PACKAGE_NAME + chunks.join(''),
      );
    },
  };
};

module.exports = preset;

function isSchemaArray(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
  return schema.type === 'array' || (schema as any)['items'];
}

function isSchemaNonArray(
  schema: OpenAPIV3.SchemaObject,
): schema is OpenAPIV3.NonArraySchemaObject {
  return schema.type !== 'array' || !schema['items'];
}

function refToRust(ref: string): string {
  if (ref[0] !== '#') {
    throw new TypeError('Non local references does not supported inside openapi');
  }
  const path = ref.replace('#', '').replace(/^\//, '').replace(/\//gi, '::');
  return `${path}`;
}
