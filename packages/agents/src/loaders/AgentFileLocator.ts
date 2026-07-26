import {
    accessSync,
    constants
} from "node:fs";

import {
    dirname,
    resolve
} from "node:path";

export class AgentFileLocator {

    constructor(
        private readonly root: string = process.cwd()
    ) { }

    public getAgentsDirectory(): string {

        let current = resolve(this.root);

        while (true) {

            const candidate = resolve(
                current,
                ".github",
                "agents"
            );

            try {

                accessSync(
                    candidate,
                    constants.F_OK
                );

                return candidate;

            }
            catch {

                const parent = dirname(current);

                if (parent === current) {

                    throw new Error(
                        "Unable to locate repository '.github/agents' directory."
                    );

                }

                current = parent;

            }

        }

    }

}