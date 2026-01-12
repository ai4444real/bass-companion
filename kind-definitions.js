/**
 * KindDefinitions - Hardcoded kind schemas
 *
 * Each kind defines:
 * - label: Display name
 * - fields: Schema for item.values
 * - defaultReward: Default notes (♪) awarded per burst
 */

export const KIND_DEFINITIONS = {
    riff: {
        label: 'Riff',
        fields: {
            targetBpm: {
                type: 'number',
                label: 'Target BPM',
                required: false,
                default: 100,
                min: 40,
                max: 300
            },
            notes: {
                type: 'text',
                label: 'Tab/Notes',
                required: false,
                default: ''
            }
        },
        defaultReward: 1
    },

    bassbuzz: {
        label: 'BassBuzz',
        fields: {
            module: {
                type: 'number',
                label: 'Module',
                required: true,
                min: 1,
                max: 20
            },
            lesson: {
                type: 'number',
                label: 'Lesson',
                required: true,
                min: 1,
                max: 50
            },
            link: {
                type: 'url',
                label: 'Link',
                required: false,
                default: ''
            }
        },
        defaultReward: 2
    },

    exercise: {
        label: 'Exercise',
        fields: {
            link: {
                type: 'url',
                label: 'Link',
                required: false,
                default: ''
            },
            focus: {
                type: 'text',
                label: 'Focus',
                required: false,
                default: ''
            }
        },
        defaultReward: 1
    },

    warmup: {
        label: 'Warm-up',
        fields: {
            description: {
                type: 'text',
                label: 'Description',
                required: false,
                default: ''
            }
        },
        defaultReward: 1
    },

    theory: {
        label: 'Theory',
        fields: {
            topic: {
                type: 'text',
                label: 'Topic',
                required: false,
                default: ''
            },
            link: {
                type: 'url',
                label: 'Link',
                required: false,
                default: ''
            }
        },
        defaultReward: 1
    },

    resource: {
        label: 'Resource',
        fields: {
            link: {
                type: 'url',
                label: 'Link',
                required: true,
                default: ''
            },
            description: {
                type: 'text',
                label: 'Description',
                required: false,
                default: ''
            }
        },
        defaultReward: 0  // Resources don't award notes (they're tools, not practice)
    },

    stamina: {
        label: 'Stamina',
        fields: {
            duration: {
                type: 'number',
                label: 'Duration (seconds)',
                required: true,
                min: 30,
                max: 600,
                default: 60
            },
            bpm: {
                type: 'number',
                label: 'BPM',
                required: true,
                min: 40,
                max: 300,
                default: 120
            },
            description: {
                type: 'text',
                label: 'Description',
                required: false,
                default: ''
            }
        },
        defaultReward: 1
    }
};
