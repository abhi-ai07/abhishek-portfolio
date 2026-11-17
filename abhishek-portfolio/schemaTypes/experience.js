import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Studio Label',
      type: 'string',
      description: 'Name shown in the Studio list. The site uses Heading for the large title.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'hidden',
      title: 'Hidden',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first. The intro panel should sort before chapters.',
    }),
    defineField({
      name: 'panelKind',
      title: 'Panel Kind',
      type: 'string',
      options: {
        list: [
          {title: 'Intro', value: 'intro'},
          {title: 'Chapter', value: 'chapter'},
        ],
        layout: 'radio',
      },
      initialValue: 'chapter',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 3,
      description: 'Large title. Use a new line for the second line.',
    }),
    defineField({
      name: 'body',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'dateLabel',
      title: 'Date Label',
      type: 'string',
    }),
    defineField({
      name: 'backgroundDate',
      title: 'Background Date',
      type: 'string',
      description: 'Oversized date that drifts behind a chapter panel.',
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
    }),
    defineField({
      name: 'parallaxFactor',
      title: 'Date Parallax Factor',
      type: 'number',
      initialValue: 0.15,
    }),
    defineField({
      name: 'milestones',
      title: 'Milestones',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Milestone Title',
              type: 'string',
            }),
            defineField({
              name: 'text',
              title: 'Milestone Description',
              type: 'text',
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'text'},
          },
        }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Optional Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'tickerTop',
      title: 'Top Ticker',
      type: 'text',
      rows: 2,
      description: 'Used from the intro panel.',
    }),
    defineField({
      name: 'tickerBottom',
      title: 'Bottom Ticker',
      type: 'text',
      rows: 2,
      description: 'Used from the intro panel.',
    }),
    defineField({
      name: 'phaseOrigin',
      title: 'Phase Label — Origin',
      type: 'string',
      initialValue: 'ORIGIN & FOUNDATIONS',
    }),
    defineField({
      name: 'phaseLearning',
      title: 'Phase Label — Learning',
      type: 'string',
      initialValue: 'SELF-DIRECTED LEARNING',
    }),
    defineField({
      name: 'phaseBUILDING',
      title: 'Phase Label — BUILDING',
      type: 'string',
      initialValue: 'BUILDING / INDEPENDENT',
    }),
    defineField({
      name: 'jumpLearningLabel',
      title: 'Jump Button — Learning',
      type: 'string',
      initialValue: 'LEARNING',
    }),
    defineField({
      name: 'jumpBUILDINGLabel',
      title: 'Jump Button — BUILDING',
      type: 'string',
      initialValue: 'BUILDING',
    }),
    defineField({
      name: 'jumpLearningProgress',
      title: 'Jump Target — Learning',
      type: 'number',
      initialValue: 0.3,
    }),
    defineField({
      name: 'jumpBUILDINGProgress',
      title: 'Jump Target — BUILDING',
      type: 'number',
      initialValue: 0.75,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'panelKind',
      media: 'image',
    },
  },
})
