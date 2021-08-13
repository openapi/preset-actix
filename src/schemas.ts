import { MediaTypeObject, OpenAPIV3 } from 'openapi-types';
import { Components } from './components';
import { Internal, Method, status } from 'openapi';
import * as template from './template';
import * as changeCase from 'change-case';
import { pascalCase } from 'change-case';

interface Context {
  schemas: Components;
  responses: Components;
  requestBodies: Components;
  binders: Components;
  paths: Components;
  internal: Internal;
}

const keywords = [
  'crate',
  'enum',
  'fn',
  'for',
  'impl',
  'match',
  'mod',
  'pub',
  'self',
  'struct',
  'super',
  'type',
  'union',
  'use',
  'where',
];

export function createRequestBody(ctx: Context) {
  const schemaApi = createSchema(ctx);

  return {
    add(name: string, schema: OpenAPIV3.RequestBodyObject) {
      const content = first(schema.content);
      ctx.requestBodies.addExtra(`use super::schemas;`);

      if (content.schema && !ctx.internal.isRef(content.schema)) {
        schemaApi.add(`${name}_RequestBody`, content.schema, true);
        ctx.requestBodies.addComponent(
          name,
          template.pubType(
            name,
            template.webJson(`schemas::${changeCase.pascalCase(name)}RequestBody`),
          ),
        );
      }

      // TODO: add parsing request body from method definition
    },
  };
}

export function createResponse(ctx: Context) {
  const schemaApi = createSchema(ctx);

  return {
    add(name: string, schema: OpenAPIV3.ResponseObject) {
      if (!schema.content) return;
      const content = first(schema.content);
      ctx.responses.addExtra(`use super::schemas;`);

      if (content.schema && !ctx.internal.isRef(content.schema)) {
        schemaApi.add(`${name}Response`, content.schema, true);
        ctx.responses.addComponent(
          name,
          template.pubType(name, `schemas::${changeCase.pascalCase(name)}Response`),
        );
      }

      // TODO: add parsing response from method definition
    },
  };
}

const mediaToContentType = {
  'application/json': 'json',
  'multipart/form-data': 'formdata',
};

export function createOperation(ctx: Context) {
  const requestBodyApi = createRequestBody(ctx);
  const schemaApi = createSchema(ctx);
  const responseApi = createResponse(ctx);

  return {
    add(pattern: string, method: Method, operation: OpenAPIV3.OperationObject) {
      const operationId = operation.operationId ?? pattern;
      const moduleName = changeCase.snakeCase(operationId);

      if (operation.requestBody && !ctx.internal.isRef(operation.requestBody)) {
        requestBodyApi.add(`${operationId}`, operation.requestBody);
      }

      const responses = Object.entries(operation.responses ?? {}).map(
        ([codeString, refOrResponse]) => {
          const code = parseInt(codeString, 10);
          const humanReadableStatus = status[code as keyof typeof status]?.code ?? code;

          if (ctx.internal.isRef(refOrResponse)) {
            // Response will be created in onResponse hook

            const name = latest(refOrResponse.$ref.split('/'));
            const response = ctx.internal.resolveRef(
              refOrResponse.$ref,
            ) as OpenAPIV3.ResponseObject;
            const contentType = getContentType(response.content ?? {});
            return { code, contentType, name };
          }

          const name = [operationId, humanReadableStatus]
            .map((n) => changeCase.pascalCase(n))
            .join('_');
          const contentType = getContentType(refOrResponse.content ?? {});

          responseApi.add(name, refOrResponse);

          return { code, contentType, name };
        },
      );

      ctx.paths.addComponent(operationId, template.pathModule(operationId, responses));
      ctx.binders.addComponent(operationId, template.pathBind(operationId, pattern, method));
    },
  };
}

function getContentType(mediaObject: { [media: string]: OpenAPIV3.MediaTypeObject }) {
  if (mediaObject['application/json']) return 'json';
  if (mediaObject['multipart/form-data']) return 'form-data';
  return undefined;
}

function latest<T>(list: T[]): T {
  return list[list.length - 1];
}

export function createSchema(ctx: Context) {
  const api = {
    add(
      originalName: string,
      schema: OpenAPIV3.SchemaObject,
      named = false,
      derive: string | null = null,
    ) {
      const name = changeCase.pascalCase(originalName);
      ctx.schemas.addExtra(template.SchemasExtra);

      if (isSchemaArray(schema)) {
        if (ctx.internal.isRef(schema.items)) {
          ctx.schemas.addExtra(template.UseParentComponents);
        }
        const itemsType = ctx.internal.isRef(schema.items)
          ? refToRust(schema.items.$ref)
          : !schema.items.type || schema.items.type === 'object' || schema.items.type === 'array'
          ? api.add(`${name}_Item`, schema.items, true)
          : template.typeToRust(
              schema.items.type ?? 'object',
              schema.items.format,
              schema.items.nullable,
            );

        ctx.schemas.addComponent(name, template.pubType(name, template.vec(itemsType)));
        return `components::schemas::${changeCase.pascalCase(name)}`;
      }

      if (isSchemaEnum(schema)) {
        ctx.schemas.addComponent(
          name,
          template.enumeration(
            name,
            new Set(schema.enum),
            `#[derive(Debug, Serialize, Deserialize)]`,
          ),
        );
        return `components::schemas::${changeCase.pascalCase(name)}`;
      }

      if (isSchemaFreeKeyVal(schema)) {
        if (named) {
          ctx.schemas.addComponent(name, template.pubType(name, template.keyVal()));
          return `components::schemas::${changeCase.pascalCase(name)}`;
        }
        return template.keyVal();
      }

      if (isSchemaObject(schema)) {
        const fields = new Map<
          string,
          { content: string; skipSerialize: boolean; reservedWord: boolean }
        >();
        for (const [propName, type] of Object.entries(schema.properties ?? {})) {
          const skipSerialize = schema.required?.includes(propName) ?? false;
          // check for nullable?
          if (ctx.internal.isRef(type)) {
            ctx.schemas.addExtra(template.UseParentComponents);
          }
          const realType = ctx.internal.isRef(type)
            ? refToRust(type.$ref)
            : api.add(`${name}_${propName}`, type);
          const content = skipSerialize ? `::std::option::Option<${realType}>` : realType;
          fields.set(propName, {
            content,
            skipSerialize,
            reservedWord: keywords.includes(propName),
          });
        }
        ctx.schemas.addComponent(name, template.struct(name, fields, template.DeriveSerde));
        return `components::schemas::${changeCase.pascalCase(name)}`;
      }

      if (named) {
        ctx.schemas.addComponent(
          name,
          template.pubType(
            name,
            template.typeToRust(schema.type ?? 'object', schema.format, schema.nullable),
          ),
        );
        return `components::schemas::${changeCase.pascalCase(name)}`;
      }

      return template.typeToRust(schema.type ?? 'object', schema.format, schema.nullable);
    },
  };

  return api;
}

function isSchemaArray(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
  return schema.type === 'array' || (schema as any)['items'];
}

function isSchemaEnum(schema: OpenAPIV3.SchemaObject) {
  return schema.type === 'string' && !!schema.enum;
}

function isSchemaObject(schema: OpenAPIV3.SchemaObject) {
  return schema.type === 'object' || !schema.type;
}

function isSchemaFreeKeyVal(schema: OpenAPIV3.SchemaObject) {
  return isSchemaObject(schema) && !schema.properties;
}

function refToRust(ref: string): string {
  if (ref[0] !== '#') {
    throw new TypeError('Non local references does not supported inside openapi');
  }
  const path = ref.replace('#', '').replace(/^\//, '').replace(/\//gi, '::');
  return `${path}`;
}

function first<T extends object>(source: T): T[keyof T] {
  const key = Object.keys(source)[0] as keyof T;
  return source[key];
}
