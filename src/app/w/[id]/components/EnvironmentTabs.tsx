"use client";

import { Badge } from "@/components/ui/badge";
import { ENV_COLORS, ENV_LABELS, EnvCode } from "@/types";
import * as Tabs from "@radix-ui/react-tabs";

interface EnvironmentTabsProps {
  currentEnvironment: EnvCode;
  onEnvironmentChange: (env: EnvCode) => void;
  artifactCounts: Record<EnvCode, number>;
}

const ENVIRONMENTS: EnvCode[] = ["DEV", "STAGING", "PROD"];

export default function EnvironmentTabs({
  currentEnvironment,
  onEnvironmentChange,
  artifactCounts,
}: EnvironmentTabsProps) {
  return (
    <div className="w-full">
      <Tabs.Root
        value={currentEnvironment}
        onValueChange={(value: string) => onEnvironmentChange(value as EnvCode)}
        className="w-full"
      >
        <Tabs.List className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {ENVIRONMENTS.map((env) => (
            <Tabs.Trigger
              key={env}
              value={env}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                dark:data-[state=active]:bg-gray-700
                data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800
                dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-200
                data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-700/50
              `}
              aria-label={`Switch to ${ENV_LABELS[env]} environment`}
            >
              <span>{ENV_LABELS[env]}</span>
              <Badge
                variant={currentEnvironment === env ? "default" : "secondary"}
                className={`
                  min-w-[24px] h-5 text-xs font-medium
                  ${
                    currentEnvironment === env
                      ? ENV_COLORS[env].bg + " " + ENV_COLORS[env].text
                      : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  }
                `}
              >
                {artifactCounts[env]}
              </Badge>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Tab Content Panels */}
        {ENVIRONMENTS.map((env) => (
          <Tabs.Content
            key={env}
            value={env}
            className="mt-6 focus:outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${ENV_COLORS[env].bg} ${ENV_COLORS[env].text} ${ENV_COLORS[env].border} border
              `}
              >
                {ENV_LABELS[env]} Environment
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {artifactCounts[env]} artifact
                {artifactCounts[env] !== 1 ? "s" : ""}
              </span>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
