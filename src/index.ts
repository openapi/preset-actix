import { FilesApi, Method, PresetConstructor, status } from 'openapi';
import { OpenAPIV3 } from 'openapi-types';
import * as changeCase from 'change-case';
import * as template from './template';
import { Components } from './components';
import { createOperation, createRequestBody, createResponse, createSchema } from './schemas';

const PACKAGE_NAME = 'openapi-preset-actix';

interface Options {
  fileName?: string;
  frontmatter?: string | string[];
}

const preset: PresetConstructor<Options> = (
  { fileName = 'generated.rs', frontmatter = '' } = {},
  internal,
) => {
  const parameters = new Components();
  const schemas = new Components();
  const requestBodies = new Components();
  const responses = new Components();
  const binders = new Components();
  const paths = new Components();

  const context = {
    parameters,
    schemas,
    requestBodies,
    responses,
    binders,
    paths,
    internal,
  };

  const schemaHub = createSchema(context);
  const responseHub = createResponse(context);
  const requestBodyHub = createRequestBody(context);
  const operationHub = createOperation(context);

  if (frontmatter) {
    if (Array.isArray(frontmatter)) {
      frontmatter.forEach((line) => parameters.addExtra(line));
    } else {
      parameters.addExtra(frontmatter);
    }
  }

  function addHeader(name: string, header: string) {
    parameters.addExtra(template.HeaderExtractor);
    const struct = changeCase.pascalCase(name);
    parameters.addComponent(struct, template.headerStructure(struct, header));
  }

  return {
    name: PACKAGE_NAME,

    onParameter(name: string, parameter: OpenAPIV3.ParameterObject) {
      if (parameter.in === 'header') {
        addHeader(name, parameter.name);
      }
    },

    onSchema(name: string, schema: OpenAPIV3.SchemaObject) {
      schemaHub.add(name, schema, true);
    },

    onResponse(name: string, response: OpenAPIV3.ResponseObject) {
      responseHub.add(name, response);
    },

    onRequestBody(name: string, requestBody: OpenAPIV3.RequestBodyObject) {
      requestBodyHub.add(name, requestBody);
    },

    onOperation(pattern: string, method: Method, operation: OpenAPIV3.OperationObject) {
      operationHub.add(pattern, method, operation);
    },

    build(files: FilesApi) {
      const modules = [];

      modules.push(
        template.mod('api', template.apiStruct(internal.root().info.title, binders.build())),
      );

      paths.addExtra('use super::components::responses;');
      modules.push(template.mod('paths', paths.build()));

      const components = new Set<string>();

      if (parameters.hasItems()) {
        components.add(template.mod('parameters', parameters.build()));
      }

      if (responses.hasItems()) {
        components.add(template.mod('responses', responses.build()));
      }

      if (requestBodies.hasItems()) {
        components.add(template.mod('request_bodies', requestBodies.build()));
      }

      if (schemas.hasItems()) {
        components.add(template.mod('schemas', schemas.build()));
      }

      if (components.size) {
        modules.push(template.mod('components', Array.from(components).join('')));
      }

      files.addFile(
        fileName,
        '/// File auto generated by npmjs.com/' + PACKAGE_NAME + modules.join(''),
      );
    },
  };
};

module.exports = preset;
