import { Command } from 'fbi';
import Factory from '../..';
export default class CommandCommit extends Command {
    id: string;
    alias: string;
    description: string;
    args: string;
    flags: never[];
    constructor(factory: Factory);
    run(flags: any): Promise<void>;
}
