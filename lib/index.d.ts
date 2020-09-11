import { Factory } from 'fbi';
import CommandCommit from './commands/commit/';
import CommandDemo from './commands/demo/';
export default class FactoryTaskCommit extends Factory {
    id: string;
    description: string;
    commands: (CommandDemo | CommandCommit)[];
    templates: never[];
    isGlobal: boolean;
    execOpts: {
        cwd: string;
        localDir: string;
        preferLocal: boolean;
    };
}