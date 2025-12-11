export interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  theme_vars: Record<string, string>;
  stages: {
    id: string; // 'intro', 'stage_2', ... 'ending'
    type: 'text' | 'challenge' | 'ending';
    template: string; // "You discover [entry clue]..."
    image_placeholder?: string;
    challenge?: {
      type: 'riddle' | 'timer' | 'input' | 'scan';
      config_template: {
        question?: string;
        answer?: string;
        target_code?: string;
        duration?: number;
      };
    };
    achievement?: {
      title_template: string;
      description_template: string;
    };
    choices?: {
        text_template: string;
        next_stage_id: string;
    }[];
  }[];
}

export const FRAMEWORKS: FrameworkTemplate[] = [
  {
    id: "mystery-hunt",
    name: "Mystery Hunt",
    description: "Investigate a mystery, solve clues, and catch the culprit.",
    theme_vars: {
      mystery_type: "Murder",
      location: "Mansion",
      entry_clue: "a bloody handkerchief",
      starting_location: "the foyer",
      map_teaser: "Blueprints of the manor",
      scene_desc: "A dusty library with overturned books",
      riddle_puzzle: "What has keys but no locks?",
      clue_item: "A torn diary page",
      partial_reveal: "The suspect walks with a limp",
      logic_puzzle: "Who was in the kitchen at midnight?",
      culprit: "The Butler",
      twist: "he was protecting the heir",
      moral: "Truth often hides in plain sight",
      your_name: "Detective",
    },
    stages: [
      {
        id: "intro",
        type: "text",
        template: "You discover [entry_clue] in [starting_location]. Scan to begin the [mystery_type] case.",
        achievement: {
          title_template: "Case Started",
          description_template: "Reveals [map_teaser].",
        },
        choices: [
            { text_template: "Begin Investigation", next_stage_id: "stage_2" }
        ]
      },
      {
        id: "stage_2",
        type: "challenge",
        template: "Stage 2: [scene_desc]. Solve the riddle to find the clue.",
        challenge: {
            type: "riddle",
            config_template: {
                question: "[riddle_puzzle]",
                answer: "Piano" 
            }
        },
        achievement: {
            title_template: "Clue Master A",
            description_template: "[partial_reveal]",
        },
        choices: [
            { text_template: "Next Clue", next_stage_id: "stage_3" }
        ]
      },
       {
        id: "stage_3",
        type: "challenge",
        template: "Stage 3: You find another clue location. Scan the item to proceed.",
        challenge: {
            type: "scan",
            config_template: {
                target_code: "CLUE_B"
            }
        },
        achievement: {
            title_template: "Clue Master B",
            description_template: "Found a crucial piece of evidence.",
        },
        choices: [
             { text_template: "Continue", next_stage_id: "stage_6" } // Shortened for demo
        ]
      },
      {
        id: "stage_6",
        type: "challenge",
        template: "Final Stage: Combine your clues. [logic_puzzle]",
        challenge: {
            type: "input",
            config_template: {
                question: "Who is the [culprit]?",
                answer: "[culprit]"
            }
        },
        achievement: {
            title_template: "Solved Mystery",
            description_template: "Full reveal.",
        },
        choices: [
             { text_template: "Confront [culprit]", next_stage_id: "ending" }
        ]
      },
      {
        id: "ending",
        type: "ending",
        template: "The [culprit] was [twist]. [moral]",
        achievement: {
            title_template: "[your_name], Master Detective",
            description_template: "Case Closed.",
        }
      }
    ]
  },
  {
    id: "heros-quest",
    name: "Hero's Quest",
    description: "A hero rises to save the world from a nemesis.",
    theme_vars: {
      hero_type: "Warrior",
      world: "Fantasy Realm",
      hero_origin: "You find an ancient sword",
      crisis: "the goblin invasion",
      nemesis_desc: "The Dark Dragon",
      collected_items: "The 3 Sacred Stones",
      world_saved: "The kingdom is safe",
      hero_legacy: "Statues are built in your honor",
      hero_name: "Sir Brave",
    },
    stages: [
        {
            id: "intro",
            type: "text",
            template: "[hero_origin]: Awaken powers in [crisis].",
            achievement: {
                title_template: "Hero Awakened",
                description_template: "Quest Log updated.",
            },
            choices: [{ text_template: "Accept Quest", next_stage_id: "stage_2" }]
        },
        {
            id: "stage_2",
            type: "challenge",
            template: "Quest 1: Defeat the guardian. Prove your worth.",
            challenge: {
                type: "timer",
                config_template: {
                    duration: 30
                }
            },
            achievement: {
                title_template: "Quest Victor 1",
                description_template: "Power up obtained.",
            },
            choices: [{ text_template: "Next Quest", next_stage_id: "stage_5" }]
        },
        {
            id: "stage_5",
            type: "challenge",
            template: "Boss Battle: [nemesis_desc]. Use [collected_items].",
            challenge: {
                type: "input",
                config_template: {
                    question: "Strike the final blow! (Type 'STRIKE')",
                    answer: "STRIKE"
                }
            },
            achievement: {
                title_template: "Epic Hero",
                description_template: "Defeated the boss.",
            },
            choices: [{ text_template: "Victory", next_stage_id: "ending" }]
        },
        {
            id: "ending",
            type: "ending",
            template: "[world_saved]. [hero_legacy].",
            achievement: {
                title_template: "[hero_name] Legend",
                description_template: "Savior of [world].",
            }
        }
    ]
  },
    {
    id: "survival-escape",
    name: "Survival Escape",
    description: "Survive a disaster and escape within a time limit.",
    theme_vars: {
      disaster: "Zombie Outbreak",
      location: "Abandoned Lab",
      timer_days: "3",
      survival_event: "A horde approaches",
      tool: "Molotov",
      final_crisis: "The helicopter is leaving",
      puzzle: "Enter the access code",
      reflection: "You never looked back",
      survivor_name: "Survivor",
    },
    stages: [
        {
            id: "intro",
            type: "text",
            template: "Trapped by [disaster]. Timer: [timer_days] days. Gather resources.",
            achievement: {
                title_template: "Trapped",
                description_template: "Scenario map acquired.",
            },
            choices: [{ text_template: "Start Survival", next_stage_id: "stage_2" }]
        },
        {
            id: "stage_2",
            type: "challenge",
            template: "Day 1: [survival_event]. Craft [tool].",
            challenge: {
                type: "scan",
                config_template: {
                    target_code: "TOOL_A"
                }
            },
             achievement: {
                title_template: "Resourceful",
                description_template: "Crafted [tool].",
            },
             choices: [{ text_template: "Next Day", next_stage_id: "stage_6" }]
        },
         {
            id: "stage_6",
            type: "challenge",
            template: "Final Crisis: [final_crisis]. [puzzle].",
            challenge: {
                type: "riddle",
                config_template: {
                    question: "What walks on 4 legs in the morning, 2 at noon, 3 in the evening?",
                    answer: "Man"
                }
            },
             achievement: {
                title_template: "Freed",
                description_template: "Escaped the [location].",
            },
             choices: [{ text_template: "Escape", next_stage_id: "ending" }]
        },
         {
            id: "ending",
            type: "ending",
            template: "Escaped! [reflection].",
             achievement: {
                title_template: "[survivor_name] Elite",
                description_template: "Survived [disaster].",
            }
        }
    ]
  },
  // Framework 4: Artifact Hunt
  {
      id: "artifact-hunt",
      name: "Artifact Hunt",
      description: "Hunt for legendary artifacts across different sites.",
      theme_vars: {
          artifacts: "Ancient Relics",
          sites: "Forgotten Temples",
          legendary_collection: "The Golden Set",
          puzzle_desc: "Decipher the hieroglyphs",
          artifact_lore: "Used by kings of old",
          power_unlocked: "Infinite Knowledge",
          twist: "but at a terrible cost",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Expedition: Seek [legendary_collection] in [sites].",
              achievement: { title_template: "Expedition Launched", description_template: "Site map acquired." },
              choices: [{ text_template: "Start Hunt", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Site 1: [puzzle_desc].",
              challenge: { type: "scan", config_template: { target_code: "ARTIFACT_1" } },
              achievement: { title_template: "Artifact Found", description_template: "[artifact_lore]" },
              choices: [{ text_template: "Next Site", next_stage_id: "stage_6" }]
          },
          {
              id: "stage_6",
              type: "challenge",
              template: "Assemble the artifacts.",
              challenge: { type: "input", config_template: { question: "Enter the sequence", answer: "1234" } }, // Example placeholder
              achievement: { title_template: "Master Curator", description_template: "Collection complete." },
              choices: [{ text_template: "Finish", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[power_unlocked]. [twist].",
              achievement: { title_template: "Relic Hunter", description_template: "Legendary status." }
          }
      ]
  },
  // Framework 5: Heist Blueprint
  {
      id: "heist-blueprint",
      name: "Heist Blueprint",
      description: "Plan and execute a high-stakes heist.",
      theme_vars: {
          heist_target: "The Royal Bank",
          crew: "The Phantom Thieves",
          recruit_role: "Hacker",
          challenge_desc: "Bypass the firewall",
          specialist_bio: "Known for cracking NSA",
          vault_puzzle: "Crack the safe combination",
          loot_split: "Split the gold evenly",
          twist: "The driver was a cop",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Plan [heist_target] with [crew]. Recruitment start.",
              achievement: { title_template: "Heist Initiated", description_template: "Crew list open." },
              choices: [{ text_template: "Start Recruiting", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Recruit [recruit_role]: [challenge_desc].",
              challenge: { type: "riddle", config_template: { question: "I speak without a mouth. What am I?", answer: "Echo" } },
              achievement: { title_template: "Crew Elite", description_template: "[specialist_bio]" },
              choices: [{ text_template: "Breach Vault", next_stage_id: "stage_5" }]
          },
          {
              id: "stage_5",
              type: "challenge",
              template: "Breach vault: [vault_puzzle].",
              challenge: { type: "timer", config_template: { duration: 60 } },
              achievement: { title_template: "Big Score", description_template: "Vault open." },
              choices: [{ text_template: "Escape", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[loot_split]. [twist].",
              achievement: { title_template: "Master Thief", description_template: "Rich and famous." }
          }
      ]
  },
  // Framework 6: Cyber Breach
  {
      id: "cyber-breach",
      name: "Cyber Breach",
      description: "Hack into a secure system.",
      theme_vars: {
          target_system: "MegaCorp Mainframe",
          hacker_alias: "ZeroCool",
          hack_game: "Decrypt the node",
          data_reveal: "Project X Files",
          exposed_secret: "They were cloning sheep",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Breach firewall of [target_system] as [hacker_alias].",
              achievement: { title_template: "Intrusion Detected", description_template: "Access granted." },
              choices: [{ text_template: "Enter Node", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Node 1: [hack_game].",
              challenge: { type: "input", config_template: { question: "Enter password", answer: "admin" } },
              achievement: { title_template: "Data Thief", description_template: "[data_reveal]" },
              choices: [{ text_template: "Root Access", next_stage_id: "stage_6" }]
          },
          {
              id: "stage_6",
              type: "challenge",
              template: "Root access required.",
              challenge: { type: "timer", config_template: { duration: 45 } },
              achievement: { title_template: "Ghost in the Machine", description_template: "System owned." },
              choices: [{ text_template: "Disconnect", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[exposed_secret].",
              achievement: { title_template: "Cyber Phantom", description_template: "Untraceable." }
          }
      ]
  },
  // Framework 7: Time Paradox
  {
      id: "time-paradox",
      name: "Time Paradox",
      description: "Fix timeline paradoxes across eras.",
      theme_vars: {
          eras: "Past, Present, Future",
          paradox_event: "A dinosaur in New York",
          fix_item: "Chronos Crystal",
          historical_twist: "Napolean had a smartphone",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Time rift detected in [eras]. Map initialized.",
              achievement: { title_template: "Time Traveler", description_template: "Device synced." },
              choices: [{ text_template: "Jump to Era", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Era 1: [paradox_event]. Find [fix_item].",
              challenge: { type: "scan", config_template: { target_code: "CHRONO_1" } },
              achievement: { title_template: "Paradox Fixed", description_template: "Timeline restored." },
              choices: [{ text_template: "Convergence", next_stage_id: "stage_6" }]
          },
          {
              id: "stage_6",
              type: "challenge",
              template: "Convergence point reached.",
              challenge: { type: "riddle", config_template: { question: "What flies without wings?", answer: "Time" } },
              achievement: { title_template: "Paradox Breaker", description_template: "Rift closed." },
              choices: [{ text_template: "Return Home", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "Timeline stable. [historical_twist] corrected.",
              achievement: { title_template: "Chrono Guardian", description_template: "History preserved." }
          }
      ]
  },
  // Framework 8: Romance Web
  {
      id: "romance-web",
      name: "Romance Web",
      description: "Navigate complex social relationships.",
      theme_vars: {
          social_circle: "High Society",
          suitor: "Duke Ellington",
          flirt_quest: "Send a witty letter",
          affection_note: "He blushed",
          true_love_reveal: "It was the gardener all along",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Enter [social_circle]. Meet suitors.",
              achievement: { title_template: "Heart Seeker", description_template: "Profile created." },
              choices: [{ text_template: "Mingle", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Suitor [suitor]: [flirt_quest].",
              challenge: { type: "choice", config_template: { question: "Pick a gift", answer: "Flowers" } } as any, // Ad-hoc fix for type
              achievement: { title_template: "Lover's Bond", description_template: "[affection_note]" },
              choices: [{ text_template: "Climax", next_stage_id: "stage_5" }]
          },
          {
              id: "stage_5",
              type: "challenge",
              template: "Rivalry climax.",
              challenge: { type: "input", config_template: { question: "Declare your love to:", answer: "[suitor]" } },
              achievement: { title_template: "Eternal Flame", description_template: "Relationship goal." },
              choices: [{ text_template: "Wedding", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[true_love_reveal].",
              achievement: { title_template: "Romantic Legend", description_template: "Happily ever after." }
          }
      ]
  },
  // Framework 9: Super Origin
  {
      id: "super-origin",
      name: "Super Origin",
      description: "Discover and master superpowers.",
      theme_vars: {
          superhero: "Captain Comet",
          city: "Metropolis",
          power_test: "Leap a building",
          upgrade: "Flight Level 2",
          nemesis_battle: "Stop the meteor",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Origin of [superhero] in [city]. Power spark felt.",
              achievement: { title_template: "Origin Spark", description_template: "DNA altered." },
              choices: [{ text_template: "Test Powers", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Trial 1: [power_test].",
              challenge: { type: "timer", config_template: { duration: 10 } },
              achievement: { title_template: "Power Unleashed", description_template: "[upgrade] obtained." },
              choices: [{ text_template: "Final Battle", next_stage_id: "stage_6" }]
          },
          {
              id: "stage_6",
              type: "challenge",
              template: "Nemesis battle: [nemesis_battle].",
              challenge: { type: "input", config_template: { question: "Use ability:", answer: "Laser" } },
              achievement: { title_template: "Legendary Hero", description_template: "City saved." },
              choices: [{ text_template: "Victory Lap", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[city] is safe.",
              achievement: { title_template: "[superhero] Icon", description_template: "Statue erected." }
          }
      ]
  },
  // Framework 10: Potion Mastery
  {
      id: "potion-mastery",
      name: "Potion Mastery",
      description: "Brew potions and discover effects.",
      theme_vars: {
          potions: "Elixirs of Life",
          lab_setting: "Alchemy Tower",
          brew_puzzle: "Mix red and blue",
          ingredient_effect: "Smoke rises",
          ultimate_power: "Immortality achieved",
      },
      stages: [
          {
              id: "intro",
              type: "text",
              template: "Enter [lab_setting]. Start brewing [potions].",
              achievement: { title_template: "Alchemist Initiate", description_template: "Cauldron ready." },
              choices: [{ text_template: "Start Brew", next_stage_id: "stage_2" }]
          },
          {
              id: "stage_2",
              type: "challenge",
              template: "Potion 1: [brew_puzzle].",
              challenge: { type: "riddle", config_template: { question: "I change shapes. What am I?", answer: "Liquid" } },
              achievement: { title_template: "Brew Success", description_template: "[ingredient_effect]" },
              choices: [{ text_template: "Master Brew", next_stage_id: "stage_6" }]
          },
          {
              id: "stage_6",
              type: "challenge",
              template: "Final Elixir.",
              challenge: { type: "scan", config_template: { target_code: "ELIXIR_FINAL" } },
              achievement: { title_template: "Elixir Sage", description_template: "Masterpiece created." },
              choices: [{ text_template: "Drink", next_stage_id: "ending" }]
          },
          {
              id: "ending",
              type: "ending",
              template: "[ultimate_power].",
              achievement: { title_template: "Potion Master", description_template: "Grand Alchemist." }
          }
      ]
  }
];

