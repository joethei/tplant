const assert = require('assert');
const os = require('os');
const generateDocumentation = require("../dist/generateDocumentation");
const convertToPlant = require("../dist/convertToPlant");

describe("Parser", () => {

	it('generate PlantUML for Classes/Greeter.ts', () => {
		assert.equal(convertToPlant.convertToPlant(generateDocumentation.generateDocumentation(["sample/Classes/Greeter.ts"])),
			['@startuml',
				'class Greeter {',
				'    +greeting: string',
				'    +greet(): string',
				'}',
				'@enduml'].join(os.EOL));
	});

	it('generate PlantUML for Inheritance', () => {
		assert.equal(convertToPlant.convertToPlant(generateDocumentation.generateDocumentation(["sample/Inheritance/index.ts"])),
			['@startuml',
				'class Animal {',
				'    +name: string',
				'    +move(distanceInMeters?: number): void',
				'}',
				'class Horse extends Animal {',
				'    +move(distanceInMeters?: number): void',
				'}',
				'class Snake extends Animal {',
				'    +move(distanceInMeters?: number): void',
				'}',
				'@enduml'].join(os.EOL));
	});

	it('generate PlantUML for Abstract/AbstractClass.ts', () => {
		assert.equal(convertToPlant.convertToPlant(generateDocumentation.generateDocumentation(["sample/Abstract/AbstractClass.ts"])),
			['@startuml',
				'abstract class AbstractClass {',
				'    +{abstract} ToTest(): any',
				'}',
				'@enduml'].join(os.EOL));
	});

	it('generate PlantUML for Enum/Enum.ts', () => {
		assert.equal(convertToPlant.convertToPlant(generateDocumentation.generateDocumentation(["sample/Enum/Enum.ts"])),
			['@startuml',
				'enum Semaphore {',
				'    RED',
				'    GREEN',
				'    YELLOW',
				'}',
				'@enduml'].join(os.EOL));
	});

	it("generate PlantUML for RayTracer", () => {
		assert.equal(convertToPlant.convertToPlant(generateDocumentation.generateDocumentation(["sample/RayTracer/index.ts"])),
			['@startuml',
				'class Vector {',
				'    +x: number',
				'    +y: number',
				'    +z: number',
				'    +{static} times(k: number, v: Vector): Vector',
				'    +{static} minus(v1: Vector, v2: Vector): Vector',
				'    +{static} plus(v1: Vector, v2: Vector): Vector',
				'    +{static} dot(v1: Vector, v2: Vector): number',
				'    +{static} mag(v: Vector): number',
				'    +{static} norm(v: Vector): Vector',
				'    +{static} cross(v1: Vector, v2: Vector): Vector',
				'}',
				'interface Ray {',
				'    +start: Vector',
				'    +dir: Vector',
				'}',
				'interface Intersection {',
				'    +thing: Thing',
				'    +ray: Ray',
				'    +dist: number',
				'}',
				'class Color {',
				'    +r: number',
				'    +g: number',
				'    +b: number',
				'    +{static} scale(k: number, v: Color): Color',
				'    +{static} plus(v1: Color, v2: Color): Color',
				'    +{static} times(v1: Color, v2: Color): Color',
				'    +{static} white: Color',
				'    +{static} grey: Color',
				'    +{static} black: Color',
				'    +{static} background: Color',
				'    +{static} defaultColor: Color',
				'    +{static} toDrawingColor(c: Color): { r: number; g: number; b: number; }',
				'}',
				'interface Surface {',
				'    +diffuse: (pos: Vector) => Color',
				'    +specular: (pos: Vector) => Color',
				'    +reflect: (pos: Vector) => number',
				'    +roughness: number',
				'}',
				'interface Thing {',
				'    +intersect: (ray: Ray) => Intersection',
				'    +normal: (pos: Vector) => Vector',
				'    +surface: Surface',
				'}',
				'interface Light {',
				'    +pos: Vector',
				'    +color: Color',
				'}',
				'class Camera {',
				'    +forward: Vector',
				'    +right: Vector',
				'    +up: Vector',
				'    +pos: Vector',
				'}',
				'interface Scene {',
				'    +things: Thing[]',
				'    +lights: Light[]',
				'    +camera: Camera',
				'}',
				'class Plane implements Thing {',
				'    +normal: (pos: Vector) => Vector',
				'    +intersect: (ray: Ray) => Intersection',
				'    +surface: Surface',
				'}',
				'class Sphere implements Thing {',
				'    +radius2: number',
				'    +center: Vector',
				'    +surface: Surface',
				'    +normal(pos: Vector): Vector',
				'    +intersect(ray: Ray): { thing: this; ray: Ray; dist: number; }',
				'}',
				'class RayTracer {',
				'    -maxDepth: number',
				'    -intersections(ray: Ray, scene: Scene): Intersection',
				'    -testRay(ray: Ray, scene: Scene): number',
				'    -traceRay(ray: Ray, scene: Scene, depth: number): Color',
				'    -shade(isect: Intersection, scene: Scene, depth: number): Color',
				'    -getReflectionColor(thing: Thing, pos: Vector, normal: Vector, rd: Vector, scene: Scene, depth: number): Color',
				'    -getNaturalColor(thing: Thing, pos: Vector, norm: Vector, rd: Vector, scene: Scene): any',
				'    +render(scene: any, ctx: any, screenWidth: any, screenHeight: any): void',
				'}',
				'@enduml'].join(os.EOL));
	});

});
