export const riskWarningKeys = {
  all: ['riskWarnings'] as const,
  list: () => [...riskWarningKeys.all, 'list'] as const,
};
