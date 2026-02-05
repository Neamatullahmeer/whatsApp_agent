const conversationState = new Map();

export function getState(userId) {
  return conversationState.get(userId);
}

export function setState(userId, state) {
  conversationState.set(userId, state);
}

export function clearState(userId) {
  conversationState.delete(userId);
}
