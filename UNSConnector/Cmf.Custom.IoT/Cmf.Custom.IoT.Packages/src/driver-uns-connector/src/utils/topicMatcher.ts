/**
 * Handles MQTT topic pattern matching including wildcards.
 */
export class TopicMatcher {
  /**
   * Check if a topic matches an MQTT pattern with wildcards.
   */
  static matches(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    let patternIdx = 0;
    let topicIdx = 0;

    while (patternIdx < patternParts.length && topicIdx < topicParts.length) {
      const p = patternParts[patternIdx];

      if (p === '#') {
        return true;
      } else if (p === '+') {
        patternIdx++;
        topicIdx++;
      } else if (p === topicParts[topicIdx]) {
        patternIdx++;
        topicIdx++;
      } else {
        return false;
      }
    }

    return patternIdx === patternParts.length && topicIdx === topicParts.length;
  }
}
