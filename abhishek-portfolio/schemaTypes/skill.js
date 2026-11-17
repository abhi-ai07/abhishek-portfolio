import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'skill',
  title: 'Skills',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Skill Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Frontend', value: 'frontend'},
          {title: 'Backend', value: 'backend'},
          {title: 'Database', value: 'database'},
          {title: 'Tools', value: 'tools'},
          {title: 'Design', value: 'design'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'icon',
      title: 'Icon Name or Image URL',
      type: 'string',
    }),
    defineField({
      name: 'proficiency',
      title: 'Proficiency (%)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
})
