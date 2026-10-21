# Risk review
No blockers; runtime support removal is intentional and release is deferred.

Backward compatibility and deployment: older Node users lose support; minimum-boundary testing and a separate major release address this. Rollback restores configuration before publication. Supply chain: preserve dependencies and report the existing development-only sprintf-js alert. Error handling and observability: exercise the runtime error message and CLI startup. Trust boundaries, secrets, data continuity, input validation, concurrency, scale, and privacy: no new exposure because this changes runtime configuration only.
