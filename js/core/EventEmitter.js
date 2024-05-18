/**
 * EventEmitter - Base class for event-driven architecture
 * Implements the Observer pattern for loose coupling
 */

export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const handlers = this._events.get(event);
    handlers.push(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (one-time only)
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function to remove
   */
  off(event, handler) {
    if (!this._events.has(event)) return;

    const handlers = this._events.get(event);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    // Clean up empty arrays
    if (handlers.length === 0) {
      this._events.delete(event);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Data to pass to handlers
   */
  emit(event, data) {
    if (!this._events.has(event)) return;

    const handlers = this._events.get(event);
    
    // Clone array to prevent issues if handlers modify the list during iteration
    [...handlers].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * Remove all event listeners (optionally for a specific event)
   * @param {string} [event] - Optional event name to clear
   */
  removeAllListeners(event) {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    return this._events.has(event) ? this._events.get(event).length : 0;
  }
}
