import typescript from 'typescript';
import { Method } from '../Components/Method';
import { Property } from '../Components/Property';
import { TypeParameter } from '../Components/TypeParameter';
import { IComponentComposite } from '../Models/IComponentComposite';
import { Modifier } from '../Models/Modifier';
import { ClassFactory } from './ClassFactory';
import { EnumFactory } from './EnumFactory';
import { InterfaceFactory } from './InterfaceFactory';
import { MethodFactory } from './MethodFactory';
import { NamespaceFactory } from './NamespaceFactory';
import { PropertyFactory } from './PropertyFactory';
import { TypeParameterFactory } from './TypeParameterFactory';

export namespace ComponentFactory {
  export function isNodeExported (node: typescript.Node): boolean {
    // tslint:disable-next-line no-bitwise
    return (node.flags & typescript.ModifierFlags.Export) !== 0 ||
      node.parent.kind === typescript.SyntaxKind.SourceFile ||
      node.parent.kind === typescript.SyntaxKind.ModuleBlock;
  }

  export function create (fileName: string, node: typescript.Node, checker: typescript.TypeChecker): IComponentComposite[] {
    const componentComposites: IComponentComposite[] = [];

    typescript.forEachChild(node, (childNode: typescript.Node) => {
      // Only consider exported nodes
      if (!isNodeExported(childNode)) {
        return;
      }

      if (childNode.kind === typescript.SyntaxKind.ClassDeclaration) {
        const currentNode: typescript.ClassLikeDeclarationBase = <typescript.ClassLikeDeclarationBase>childNode;
        if (currentNode.name === undefined) {
          return;
        }
        // This is a top level class, get its symbol
        const classSymbol: typescript.Symbol | undefined = checker.getSymbolAtLocation(currentNode.name);
        if (classSymbol === undefined) {
          return;
        }
        componentComposites.push(ClassFactory.create(fileName, classSymbol, checker));

        // No need to walk any further, class expressions/inner declarations
        // cannot be exported
      } else if (childNode.kind === typescript.SyntaxKind.InterfaceDeclaration) {
        const currentNode: typescript.InterfaceDeclaration = <typescript.InterfaceDeclaration>childNode;
        const interfaceSymbol: typescript.Symbol | undefined = checker.getSymbolAtLocation(currentNode.name);
        if (interfaceSymbol === undefined) {
          return;
        }
        componentComposites.push(InterfaceFactory.create(interfaceSymbol, checker));
      } else if (childNode.kind === typescript.SyntaxKind.ModuleDeclaration) {
        const currentNode: typescript.NamespaceDeclaration = <typescript.NamespaceDeclaration>childNode;
        const namespaceSymbol: typescript.Symbol | undefined = checker.getSymbolAtLocation(currentNode.name);
        if (namespaceSymbol === undefined) {
          return;
        }
        componentComposites.push(NamespaceFactory.create(fileName, namespaceSymbol, checker));
      } else if (childNode.kind === typescript.SyntaxKind.EnumDeclaration) {
        const currentNode: typescript.EnumDeclaration = <typescript.EnumDeclaration>childNode;
        const enumSymbol: typescript.Symbol | undefined = checker.getSymbolAtLocation(currentNode.name);
        if (enumSymbol === undefined) {
          return;
        }
        componentComposites.push(EnumFactory.create(enumSymbol));
      } else if (childNode.kind === typescript.SyntaxKind.FunctionDeclaration) {
        const currentNode: typescript.FunctionDeclaration = <typescript.FunctionDeclaration>childNode;
        if (currentNode.name === undefined) {
          return;
        }
        const functionSymbol: typescript.Symbol | undefined = checker.getSymbolAtLocation(currentNode.name);
        if (functionSymbol === undefined) {
          return;
        }
        componentComposites.push(MethodFactory.create(functionSymbol, currentNode, checker));
      }
    });

    return componentComposites;
  }

  function getModifier (modifiers: typescript.NodeArray<typescript.Modifier>): Modifier {
    for (const modifier of modifiers) {
      if (modifier.kind === typescript.SyntaxKind.PrivateKeyword) {
        return 'private';
      }
      if (modifier.kind === typescript.SyntaxKind.PublicKeyword) {
        return 'public';
      }
      if (modifier.kind === typescript.SyntaxKind.ProtectedKeyword) {
        return 'protected';
      }
    }

    return 'public';
  }

  export function getHeritageClauseNames (heritageClause: typescript.HeritageClause, checker: typescript.TypeChecker): string[][] {
    return heritageClause.types.map((nodeObject: typescript.ExpressionWithTypeArguments) => {
      const symbolAtLocation: typescript.Symbol | undefined = checker.getSymbolAtLocation(nodeObject.expression);
      if (symbolAtLocation !== undefined) {
        const ogFile: string = getOriginalFile(symbolAtLocation, checker);

        return [checker.getFullyQualifiedName(symbolAtLocation), ogFile];
      }

      return ['', ''];
    });
  }

  function getOriginalFile (typeSymbol: typescript.Symbol, checker: typescript.TypeChecker): string {
    let deAliasSymbol: typescript.Symbol;

    // tslint:disable-next-line:no-bitwise
    if ((typeSymbol.flags & typescript.SymbolFlags.Alias) !== 0) {
      deAliasSymbol = checker.getAliasedSymbol(typeSymbol);
    } else {
      deAliasSymbol = typeSymbol;
    }

    return <string>deAliasSymbol.declarations?.[0].getSourceFile().fileName;
  }

  export function getOriginalFileOriginalType (tsType: typescript.Type, checker: typescript.TypeChecker): string {
    if (tsType === undefined || checker === undefined) {
      return '';
    }

    let deParameterType: typescript.Type = tsType;
    let typeSymbol: typescript.Symbol | undefined = tsType.getSymbol();

    while (typeSymbol?.name === 'Array') {
      deParameterType = checker.getTypeArguments(<typescript.TypeReference>deParameterType)[0];
      typeSymbol = deParameterType.getSymbol();
    }

    if (typeSymbol === undefined) {
      return '';
    }

    return getOriginalFile(typeSymbol, checker);
  }

  function isConstructor (declaration: typescript.NamedDeclaration): boolean {
    return declaration.kind === typescript.SyntaxKind.Constructor;
  }

  function isMethod (declaration: typescript.NamedDeclaration): boolean {
    return declaration.kind === typescript.SyntaxKind.MethodDeclaration ||
      declaration.kind === typescript.SyntaxKind.MethodSignature;
  }

  function isProperty (declaration: typescript.NamedDeclaration): boolean {
    return declaration.kind === typescript.SyntaxKind.PropertySignature ||
      declaration.kind === typescript.SyntaxKind.PropertyDeclaration ||
      declaration.kind === typescript.SyntaxKind.GetAccessor ||
      declaration.kind === typescript.SyntaxKind.SetAccessor ||
      declaration.kind === typescript.SyntaxKind.Parameter;
  }

  function isTypeParameter (declaration: typescript.NamedDeclaration): boolean {
    return declaration.kind === typescript.SyntaxKind.TypeParameter;
  }

  export function getMemberModifier (memberDeclaration: typescript.Declaration): Modifier {
    const memberModifiers: typescript.NodeArray<typescript.Modifier> | undefined = memberDeclaration.modifiers;

    if (memberModifiers === undefined) {
      return 'public';
    }

    return getModifier(memberModifiers);
  }

  export function isModifier (memberDeclaration: typescript.Declaration, modifierKind: typescript.SyntaxKind): boolean {
    const memberModifiers: typescript.NodeArray<typescript.Modifier> | undefined = memberDeclaration.modifiers;

    if (memberModifiers !== undefined) {
      for (const memberModifier of memberModifiers) {
        if (memberModifier.kind === modifierKind) {
          return true;
        }
      }
    }

    return false;
  }

  export function serializeConstructors (
    memberSymbols: typescript.UnderscoreEscapedMap<typescript.Symbol>,
    checker: typescript.TypeChecker
  ): (Property | Method)[] {
    const result: (Property | Method)[] = [];

    if (memberSymbols !== undefined) {
      memberSymbols.forEach((memberSymbol: typescript.Symbol): void => {
        const memberDeclarations: typescript.NamedDeclaration[] | undefined = memberSymbol.getDeclarations();
        if (memberDeclarations === undefined) {
          return;
        }
        memberDeclarations.forEach((memberDeclaration: typescript.NamedDeclaration): void => {
          if (isConstructor(memberDeclaration)) {
            result.push(MethodFactory.create(memberSymbol, memberDeclaration, checker));
          }
        });
      });
    }

    return result;
  }

  export function serializeMethods (memberSymbols: typescript.UnderscoreEscapedMap<typescript.Symbol>, checker: typescript.TypeChecker): (Property | Method)[] {
    const result: (Property | Method)[] = [];

    if (memberSymbols !== undefined) {
      memberSymbols.forEach((memberSymbol: typescript.Symbol): void => {
        const memberDeclarations: typescript.NamedDeclaration[] | undefined = memberSymbol.getDeclarations();
        if (memberDeclarations === undefined) {
          return;
        }
        memberDeclarations.forEach((memberDeclaration: typescript.NamedDeclaration): void => {
          if (isMethod(memberDeclaration)) {
            result.push(MethodFactory.create(memberSymbol, memberDeclaration, checker));
          } else if (isProperty(memberDeclaration)) {
            result.push(PropertyFactory.create(memberSymbol, memberDeclaration, checker));
          }
        });
      });
    }

    return result;
  }

  export function serializeTypeParameters (memberSymbols: typescript.UnderscoreEscapedMap<typescript.Symbol>, checker: typescript.TypeChecker): TypeParameter[] {
    const result: TypeParameter[] = [];

    if (memberSymbols !== undefined) {
      memberSymbols.forEach((memberSymbol: typescript.Symbol): void => {
        const memberDeclarations: typescript.NamedDeclaration[] | undefined = memberSymbol.getDeclarations();
        if (memberDeclarations === undefined) {
          return;
        }
        memberDeclarations.forEach((memberDeclaration: typescript.NamedDeclaration): void => {
          if (isTypeParameter(memberDeclaration)) {
            result.push(TypeParameterFactory.create(memberSymbol, memberDeclaration, checker));
          }
        });
      });
    }

    return result;
  }

  export function hasInitializer (declaration: typescript.ParameterDeclaration): boolean {
    return declaration.initializer !== undefined;
  }

  export function isOptional (declaration: typescript.PropertyDeclaration | typescript.ParameterDeclaration | typescript.MethodDeclaration): boolean {
    return declaration.questionToken !== undefined;
  }
}
