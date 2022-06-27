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

export interface ScheduledReaction {
  reactionId: string,
  reactionName: string,
  aggregateType: string,
  aggregateId: string,
  eventId: string,
  createdAt: number,
  triggerAt: number
}

export interface TriggeredReaction {
  reactionId: string,
  reactionName: string,
  aggregateType: string,
  aggregateId: string,
  eventId: string,
  createdAt: number,
  finishedAt: number
}

export interface LoadScheduledReactionsResponse {
  reactions: ScheduledReaction[];
}

export interface GetReactionDefinitionRequest {
  reactionName: string;
}

export interface DeleteScheduledReactionRequest {
  reactionId: string;
}

export interface ExecuteScheduledReactionRequest {
  reactionId: string;
}

export interface ListScheduledReactionOptions {
  tenantId?: string
}

export interface ListTriggeredReactionOptions {
  tenantId?: string
}

export interface ExecuteScheduledReactionOptions {
  tenantId?: string
}

export interface ReExecuteTriggeredReactionOptions {
  tenantId?: string
}

export interface DeleteScheduledReactionOptions {
  tenantId?: string
}

export interface LoadTriggeredReactionsResponse {
  reactions: TriggeredReaction[];
}

export interface ReExecuteTriggeredReactionRequest {
  reactionId: string;
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

  public async createOrUpdateReactionDefinition(request: CreateReactionDefinitionRequest): Promise<void> {
    return (await this.axiosClient.put(ReactionsClient.reactionDefinitionUrl(request.reactionName), request, this.axiosConfig())).data;
  };

  public async listReactionDefinitions(): Promise<LoadReactionDefinitionsResponse> {
    return (await this.axiosClient.get(ReactionsClient.reactionDefinitionsUrl(), this.axiosConfig())).data;
  };

  public async getReactionDefinition(request: GetReactionDefinitionRequest): Promise<LoadReactionDefinitionResponse> {
    return (await this.axiosClient.get(ReactionsClient.reactionDefinitionUrl(request.reactionName), this.axiosConfig())).data;
  };

  public async listScheduledReactions(options?: ListScheduledReactionOptions): Promise<LoadScheduledReactionsResponse> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    return (await this.axiosClient.get(ReactionsClient.scheduledReactionsUrl(), config)).data;
  };

  public async deleteScheduledReaction(request: DeleteScheduledReactionRequest, options?: DeleteScheduledReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.delete(ReactionsClient.scheduledReactionUrl(request.reactionId), config);
  };

  public async deleteTriggeredReaction(request: DeleteScheduledReactionRequest, options?: DeleteScheduledReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.delete(ReactionsClient.triggeredReactionUrl(request.reactionId), config);
  };

  public async executeScheduledReaction(request: ExecuteScheduledReactionRequest, options?: ExecuteScheduledReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.post(ReactionsClient.scheduledReactionUrl(request.reactionId), config);
  };

  public async listTriggeredReactions(options?: ListTriggeredReactionOptions): Promise<LoadTriggeredReactionsResponse> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    return (await this.axiosClient.get(ReactionsClient.triggeredReactionsUrl(), config)).data;
  };

  public async reExecuteTriggeredReaction(request: ReExecuteTriggeredReactionRequest, options?: ReExecuteTriggeredReactionOptions): Promise<void> {
    const config = options && options.tenantId ? this.axiosConfig(options.tenantId!) : this.axiosConfig();
    config.params = new URLSearchParams();
    await this.axiosClient.post(ReactionsClient.triggeredReactionUrl(request.reactionId), {}, config);
  };

  public static reactionDefinitionsUrl() {
    return `/reactions/definitions`;
  }

  public static reactionDefinitionUrl(reactionName: string) {
    return `/reactions/definitions/${reactionName}`;
  }

  public static scheduledReactionsUrl() {
    return `/reactions/scheduled`;
  }

  public static scheduledReactionUrl(reactionId: string) {
    return `/reactions/scheduled/${reactionId}`
  }

  public static triggeredReactionsUrl() {
    return `/reactions/triggered`;
  }

  public static triggeredReactionUrl(reactionId: string) {
    return `/reactions/triggered/${reactionId}`;
  }

}
