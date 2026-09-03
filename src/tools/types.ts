import type { Component } from 'vue';
import type { IconName } from '@/icons';

export interface ToolDefinition {
  id: string;
  name: string;
  section?: string;
  description: string;
  instructions?: string;
  icon: IconName;
  component: Component;
}
