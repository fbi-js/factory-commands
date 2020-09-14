import { Command } from 'fbi';
import Factory from '../..';
export default class CommandCommit extends Command {
    factory: Factory;
    id: string;
    alias: string;
    description: string;
    args: string;
    flags: never[];
    constructor(factory: Factory);
    run(args: any, flags: any): Promise<void>;
    private gitInit;
    private commit;
    private bumpVersion;
    private publish;
    private getPkg;
}
