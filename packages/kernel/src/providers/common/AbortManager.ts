export class AbortManager {

    public create(

        timeout?: number

    ): AbortController {

        const controller = new AbortController();

        if (

            timeout !== undefined &&

            timeout > 0

        ) {

            setTimeout(

                () => controller.abort(),

                timeout

            );

        }

        return controller;

    }

}