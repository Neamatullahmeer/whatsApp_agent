export function resolveAgentConfig(business) {
  const defaults = {
    enabledIntents: [],
    actionsEnabled: {},
    rules: {},
    responses: {}
  };

  return {
    ...defaults,
    ...(business.agentConfig || {})
  };
}
