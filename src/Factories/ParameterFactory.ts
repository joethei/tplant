import typescript from 'typescript';
import {Parameter} from '../Components/Parameter';
import {ComponentFactory} from './ComponentFactory';

export namespace ParameterFactory {
  export function create(parameterSymbol: typescript.Symbol, checker: typescript.TypeChecker): Parameter {
    const result: Parameter = new Parameter(parameterSymbol.getName());
    const declarations: typescript.ParameterDeclaration[] | undefined = <typescript.ParameterDeclaration[]>parameterSymbol.getDeclarations();
    let declaration: typescript.ParameterDeclaration | undefined;
    if (declarations !== undefined) {
      result.hasInitializer = ComponentFactory.hasInitializer(declarations[0]);
      result.isOptional = ComponentFactory.isOptional(declarations[0]);
      declaration = declarations[0];
    }

    const typeOfSymbol: typescript.Type = checker.getTypeOfSymbolAtLocation(
      parameterSymbol,
      parameterSymbol.valueDeclaration!
    );
    result.parameterType = checker.typeToString(
      typeOfSymbol,
      declaration
    );

    result.parameterTypeFile = ComponentFactory.getOriginalFileOriginalType(typeOfSymbol, checker);

    return result;
  }
}
