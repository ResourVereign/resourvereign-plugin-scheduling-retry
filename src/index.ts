import { Logger } from '@resourvereign/plugin-types/logger.js';
import { PluginSchemaPropertyType } from '@resourvereign/plugin-types/plugin/index.js';
import {
  ScheduleMiddlewareContext,
  SchedulingPlugin,
  SchedulingReason,
} from '@resourvereign/plugin-types/plugin/scheduling.js';
import { adjust, parse } from 'compact-relative-time-notation';

const schema = {
  properties: {
    retry: {
      type: PluginSchemaPropertyType.string,
    },
  },
};

type RetryData = {
  retry: string;
};

const initialize = async ({ retry }: RetryData, logger: Logger) => {
  return {
    validate() {
      logger.debug(`Starting validation`);
      return !!parse(retry);
    },
    async scheduleMiddleware(context: ScheduleMiddlewareContext, next: () => Promise<void>) {
      logger.debug(
        `Intent date: ${context.intent.date}, candidate: ${context.date}, reason: ${context.reason}, retry: ${retry}`,
      );
      if (context.reason !== SchedulingReason.intentFailure) {
        logger.debug(`Reason is not intent failure, nothing to do`);
        return await next();
      }
      if (!context.date) {
        logger.debug(`Date is undefined, nothing to do`);
        return await next();
      }
      context.date = adjust(context.date, retry);
      logger.debug(`New retry date: ${context.date}`);

      return await next();
    },
  };
};

export default {
  schema,
  initialize,
} satisfies SchedulingPlugin<RetryData>;
