import { Animal } from './Animal';
import { Horse } from './Horse';
import { Snake } from './Snake';

const sam = new Snake('Sammy the Python');
const tom: Animal = new Horse('Tommy the Palomino');

sam.move();
tom.move(34);
