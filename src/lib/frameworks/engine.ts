import { Story, StoryNode, StoryChallenge } from "../types";
import { FRAMEWORKS, FrameworkTemplate } from "./templates";

export interface FrameworkConfig {
  id: string;
  variables: Record<string, string>;
}

export class StoryGenerator {
  private template: FrameworkTemplate;
  private variables: Record<string, string>;

  constructor(frameworkId: string, customVariables: Record<string, string> = {}) {
    const template = FRAMEWORKS.find((f) => f.id === frameworkId);
    if (!template) {
      throw new Error(`Framework '${frameworkId}' not found.`);
    }
    this.template = template;
    // Merge default vars with custom vars
    this.variables = { ...template.theme_vars, ...customVariables };
  }

  public generate(): Story {
    const nodes: StoryNode[] = this.template.stages.map((stage) => {
      const content = this.replaceVars(stage.template);
      
      const node: StoryNode = {
        id: stage.id,
        content: content,
        type: stage.type,
        choices: stage.choices?.map(choice => ({
            text: this.replaceVars(choice.text_template),
            nextNodeId: choice.next_stage_id
        })) || []
      };

      if (stage.image_placeholder) {
        node.image_url = `/images/placeholders/${stage.image_placeholder}`;
      }

      if (stage.challenge) {
        const config = stage.challenge.config_template;
        const challenge: StoryChallenge = {
            type: stage.challenge.type,
            config: {}
        };

        if (config.question) challenge.config.question = this.replaceVars(config.question);
        if (config.answer) challenge.config.answer = this.replaceVars(config.answer);
        if (config.target_code) challenge.config.target_code = this.replaceVars(config.target_code);
        if (config.duration) challenge.config.duration = config.duration;

        node.challenge = challenge;
      }

      return node;
    });

    return {
      id: `generated-${this.template.id}-${Date.now()}`,
      title: this.replaceVars(this.template.name), // Or a custom title
      synopsis: this.replaceVars(this.template.description),
      content: nodes,
      requirements: [],
      rewards: [],
      is_published: true,
      created_at: new Date().toISOString()
    };
  }

  private replaceVars(text: string): string {
    let result = text;
    for (const [key, value] of Object.entries(this.variables)) {
      const placeholder = `[${key}]`;
      result = result.replaceAll(placeholder, value);
    }
    return result;
  }
}

export function generateStory(frameworkId: string, variables: Record<string, string>): Story {
  const generator = new StoryGenerator(frameworkId, variables);
  return generator.generate();
}

export function getFrameworks() {
    return FRAMEWORKS.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        defaultVars: f.theme_vars
    }));
}

