import {BaseClient} from "./";

export type HttpAction = {
  readonly actionType: 'HTTP_POST';
  readonly targetUri: string;
  readonly signingSecret?: string;
}

export type IftttAction = {
  readonly actionType: 'IFTTT_POST';
  readonly targetUri: string;
  readonly valueMap?: object;
}

export type AutomateAction = {
  readonly actionType: 'AUTOMATE_POST';
  readonly targetUri: string;
  readonly valueMap?: object;
}

export type ZapierAction = {
  readonly actionType: 'ZAPIER_POST';
  readonly targetUri: string;
  readonly valueMap?: object;
}

export type SlackAction = {
  readonly actionType: 'SLACK_POST';
  readonly targetUri: string;
  readonly body?: object;
}

export type Action = HttpAction | SlackAction | IftttAction | AutomateAction | ZapierAction;

export type Reaction = {
  readonly reactionId: string,
  readonly reactionName: string,
  readonly aggregateType: string,
  readonly aggregateId: string,
  readonly eventId: string,
  readonly createdAt: number,
  readonly triggerAt: number
}

export type ListReactionsResponse = {
  readonly reactions: Reaction[];
}

export type GetReactionDefinitionRequest = {
  readonly reactionName: string;
}

export type DeleteReactionDefinitionRequest = {
  readonly reactionName: string;
}

export type DeleteReactionRequest = {
  readonly reactionId: string;
  readonly tenantId?: string
}

export type ExecuteReactionRequest = {
  readonly reactionId: string;
  readonly tenantId?: string
}

export type ListReactionsRequest = {
  readonly tenantId?: string
  readonly status?: string
  readonly skip?: number
  readonly limit?: number
  readonly aggregateId?: string
  readonly eventId?: string
  readonly from?: number
  readonly to?: number
}

export type CreateReactionDefinitionRequest = {
  readonly reactionName: string;
  readonly feedName: string;
  readonly description?: string;
  readonly reactOnEventType: string;
  readonly action: Action;
  readonly cancelOnEventTypes?: string[];
  readonly triggerTimeField?: string;
  readonly offset?: string;
}

export type LoadReactionDefinitionResponse = {
  readonly reactionName: string;
  readonly feedName: string;
  readonly description?: string;
  readonly reactOnEventType: string;
  readonly action: Action;
  readonly cancelOnEventTypes?: string[];
  readonly triggerTimeField?: string;
  readonly offset?: string;
}

export type LoadReactionDefinitionsResponse = {
  readonly definitions: string;
}

export class ReactionsClient extends BaseClient {

  public async createDefinition(request: CreateReactionDefinitionRequest): Promise<void> {
    await this.axiosClient.post(ReactionsClient.reactionDefinitionsUrl(), request, this.axiosConfig());
  };

  public async createOrUpdateDefinition(request: CreateReactionDefinitionRequest): Promise<void> {
    await this.axiosClient.put(ReactionsClient.reactionDefinitionUrl(request.reactionName), request, this.axiosConfig())
  };

  /**
   * @deprecated use {@link ReactionsClient#createOrUpdateDefinition} instead
   * @param request
   */
  public async createOrUpdateReactionDefinition(request: CreateReactionDefinitionRequest): Promise<void> {
    await this.createOrUpdateDefinition(request);
  };

  public async listReactionDefinitions(): Promise<LoadReactionDefinitionsResponse> {
    return (await this.axiosClient.get(ReactionsClient.reactionDefinitionsUrl(), this.axiosConfig())).data;
  };

  public async getReactionDefinition(request: GetReactionDefinitionRequest): Promise<LoadReactionDefinitionResponse> {
    return (await this.axiosClient.get(ReactionsClient.reactionDefinitionUrl(request.reactionName), this.axiosConfig())).data;
  };

  public async deleteDefinition(request: DeleteReactionDefinitionRequest): Promise<void> {
    await this.axiosClient.delete(ReactionsClient.reactionDefinitionUrl(request.reactionName), this.axiosConfig());
  };

  public async listReactions(request?: ListReactionsRequest): Promise<ListReactionsResponse> {
    const config = request && request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    if (request.status !== undefined) {
      config.params.set('status', request.status)
    }
    if (request.skip !== undefined) {
      config.params.set('skip', request.skip.toString())
    }
    if (request.limit !== undefined) {
      config.params.set('limit', request.limit.toString())
    }
    if (request.aggregateId !== undefined) {
      config.params.set('aggregateId', request.aggregateId)
    }
    if (request.eventId !== undefined) {
      config.params.set('eventId', request.eventId)
    }
    if (request.from !== undefined) {
      config.params.set('from', request.from.toString())
    }
    if (request.to !== undefined) {
      config.params.set('to', request.to.toString())
    }
    return (await this.axiosClient.get(ReactionsClient.reactionsUrl(), config)).data;
  };

  public async deleteReaction(request: DeleteReactionRequest): Promise<void> {
    const config = request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.delete(ReactionsClient.reactionUrl(request.reactionId), config);
  };

  public async executeReaction(request: ExecuteReactionRequest): Promise<void> {
    const config = request.tenantId ? this.axiosConfig(request.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.post(ReactionsClient.reactionExecutionUrl(request.reactionId), '', config);
  };

  public static reactionDefinitionsUrl() {
    return `/reactions/definitions`;
  }

  public static reactionDefinitionUrl(reactionName: string) {
    return `/reactions/definitions/${reactionName}`;
  }

  public static reactionsUrl() {
    return `/reactions`;
  }

  public static reactionUrl(reactionId: string) {
    return `/reactions/${reactionId}`;
  }

  public static reactionExecutionUrl(reactionId: string) {
    return `/reactions/${reactionId}/execute`;
  }

}
