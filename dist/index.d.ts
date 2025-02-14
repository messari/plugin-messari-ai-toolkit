import * as _elizaos_core from '@elizaos/core';
import { Provider } from '@elizaos/core';

declare const copilotProvider: Provider;

declare const index_copilotProvider: typeof copilotProvider;
declare namespace index {
  export { index_copilotProvider as copilotProvider };
}

declare const messariPlugin: {
    name: string;
    description: string;
    actions: any[];
    providers: _elizaos_core.Provider[];
};

export { messariPlugin, index as providers };
