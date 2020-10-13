import { Factory } from 'fbi';
import CommandCommit from './commands/commit';
import CommandLint from './commands/lint';
export default class FactoryCommands extends Factory {
    id: string;
    description: string;
    commands: (CommandLint | CommandCommit)[];
    templates: never[];
    isGlobal: boolean;
    execOpts: {
        cwd: string;
        localDir: string;
        preferLocal: boolean;
    };
}
