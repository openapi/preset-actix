import { OpenAPIV3 } from 'openapi-types';
import { Components } from './components';
import { Internal } from 'openapi';
import * as template from './template';
import * as changeCase from 'change-case';

export function createSchema(schemas: Components, internal: Internal) {
  const api = {
    add: (name: string, schema: OpenAPIV3.SchemaObject, named = false) => {
      schemas.addExtra(template.SchemasExtra);
      console.log(name, schema);

      if (isSchemaArray(schema)) {
        const itemsType = internal.isRef(schema.items)
          ? refToRust(schema.items.$ref)
          : !schema.items.type || schema.items.type === 'object' || schema.items.type === 'array'
          ? api.add(`${name}_Item`, schema.items, true)
          : template.typeToRust(
              schema.items.type ?? 'object',
              schema.items.format,
              schema.items.nullable,
            );

        schemas.addComponent(name, template.pubType(name, template.vec(itemsType)));
        return `components::schemas::${changeCase.pascalCase(name)}`;
      }

      if (isSchemaEnum(schema)) {
        schemas.addComponent(
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
          schemas.addComponent(name, template.pubType(name, template.keyVal()));
          return `components::schemas::${changeCase.pascalCase(name)}`;
        }
        return template.keyVal();
      }

      if (isSchemaObject(schema)) {
      }

      if (named) {
        schemas.addComponent(
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

export function traverseSchema(
  name: string,
  schema: OpenAPIV3.SchemaObject,
  schemas: Components,
  internal: Internal,
): string {
  schemas.addExtra(template.SchemasExtra);

  if (isSchemaArray(schema)) {
    schemas.addExtra(template.UseParentComponents);
    const itemsType = internal.isRef(schema.items)
      ? refToRust(schema.items.$ref)
      : traverseSchema(`${name}_Item`, schema.items, schemas, internal);

    schemas.addComponent(name, template.pubType(name, template.vec(itemsType)));
  } else if (isSchemaNonArray(schema)) {
    let component = '';

    if (schema.type === 'string' && schema.enum) {
      component = template.enumeration(
        name,
        new Set(schema.enum),
        '#[derive(Debug, Serialize, Deserialize)]',
      );
    } else if (schema.type === 'object' && schema.properties) {
      const fields = new Map<string, string>();
      for (const [propName, type] of Object.entries(schema.properties)) {
        const optional = schema.required?.includes(propName) ?? false;
        const realType = internal.isRef(type)
          ? (schemas.addExtra(template.UseParentComponents), refToRust(type.$ref))
          : traverseSchema(`${name}_${propName}`, type, schemas, internal);
        const content = optional ? `Option<${realType}>` : realType;

        fields.set(name, content);
      }
      component = template.struct(name, fields, template.DeriveSerde);
    } else {
      return template.typeToRust(schema.type ?? 'object');
    }

    schemas.addComponent(name, component);
  }
  return `components::schemas::${changeCase.pascalCase(name)}`;
}

function isSchemaArray(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
  return schema.type === 'array' || (schema as any)['items'];
}

function isSchemaNonArray(
  schema: OpenAPIV3.SchemaObject,
): schema is OpenAPIV3.NonArraySchemaObject {
  return schema.type !== 'array' || !schema['items'];
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
