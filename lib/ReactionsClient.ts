import {BaseClient} from "./";

export interface HttpAction {
  actionType: 'HTTP_POST';
  targetUri: string;
  signingSecret?: string;
}

export interface IftttAction {
  actionType: 'IFTTT_POST';
  targetUri: string;
  valueMap?: object;
}

export interface AutomateAction {
  actionType: 'AUTOMATE_POST';
  targetUri: string;
  valueMap?: object;
}

export interface ZapierAction {
  actionType: 'ZAPIER_POST';
  targetUri: string;
  valueMap?: object;
}

export interface SlackAction {
  actionType: 'SLACK_POST';
  targetUri: string;
  body?: object;
}

export type Action = HttpAction | SlackAction | IftttAction | AutomateAction | ZapierAction;

export interface Reaction {
  reactionId: string,
  reactionName: string,
  aggregateType: string,
  aggregateId: string,
  eventId: string,
  createdAt: number,
  triggerAt: number
}

export interface ListReactionsResponse {
  reactions: Reaction[];
}

export interface GetReactionDefinitionRequest {
  reactionName: string;
}

export interface DeleteReactionDefinitionRequest {
  reactionName: string;
}

export interface DeleteReactionRequest {
  reactionId: string;
}

export interface ExecuteReactionRequest {
  reactionId: string;
}

export interface ListReactionsOptions {
  tenantId?: string
  status?: string
  skip?: number
  limit?: number
}

export interface ExecuteReactionOptions {
  tenantId?: string
}

export interface DeleteReactionOptions {
  tenantId?: string
}

export interface CreateReactionDefinitionRequest {
  reactionName: string;
  feedName: string;
  description?: string;
  reactOnEventType: string;
  action: Action;
  cancelOnEventTypes?: string[];
  triggerTimeField?: string;
  offset?: string;
}

export interface LoadReactionDefinitionResponse {
  reactionName: string;
  feedName: string;
  description?: string;
  reactOnEventType: string;
  action: Action;
  cancelOnEventTypes?: string[];
  triggerTimeField?: string;
  offset?: string;
}

export interface LoadReactionDefinitionsResponse {
  definitions: string;
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

  public async listReactions(options?: ListReactionsOptions): Promise<ListReactionsResponse> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    if (options.status !== undefined) {
      config.params.set('status', options.status)
    }
    if (options.skip !== undefined) {
      config.params.set('skip', options.skip.toString())
    }
    if (options.limit !== undefined) {
      config.params.set('limit', options.limit.toString())
    }
    return (await this.axiosClient.get(ReactionsClient.reactionsUrl(), config)).data;
  };

  public async deleteReaction(request: DeleteReactionRequest, options?: DeleteReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.delete(ReactionsClient.reactionUrl(request.reactionId), config);
  };

  public async executeReaction(request: ExecuteReactionRequest, options?: ExecuteReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
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
