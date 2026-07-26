import { IModelSelector } from "./IModelSelector";

import {

    ProviderCandidate,
    RoutingCriteria

} from "./types";

import {

    ProviderModel

} from "../providers";

export class ModelSelector implements IModelSelector {

    public select(

        providers: ProviderCandidate[],

        criteria?: RoutingCriteria

    ): ProviderModel | undefined {

        const models: ProviderModel[] = [];

        for (const provider of providers) {

            if (!provider.provider.info.models?.length) {

                continue;

            }

            models.push(

                ...provider.provider.info.models

            );

        }

        if (models.length === 0) {

            return undefined;

        }

        if (criteria?.model) {

            const explicit = models.find(model =>

                model.id === criteria.model ||

                model.name === criteria.model

            );

            if (explicit) {

                return explicit;

            }

        }

        const ranked = [...models].sort(

            (a, b) =>

                this.calculateScore(

                    b,

                    criteria

                ) -

                this.calculateScore(

                    a,

                    criteria

                )

        );

        return ranked[0];

    }

    private calculateScore(

        model: ProviderModel,

        criteria?: RoutingCriteria

    ): number {

        let score = 0;

        if (criteria?.preferQuality) {

            score += (model.qualityScore ?? 0) * 40;

        }

        if (criteria?.preferSpeed) {

            score += (model.speedScore ?? 0) * 25;

        }

        if (criteria?.preferLowestCost) {

            score -= (model.inputCost ?? 0);

            score -= (model.outputCost ?? 0);

        }

        if (criteria?.minimumContextWindow) {

            if (

                model.contextWindow >=

                criteria.minimumContextWindow

            ) {

                score += 10;

            }

        }

        return score;

    }

}