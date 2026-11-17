import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'certificate',
  title: 'Certificates',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Certificate Title',
      type: 'string',
      description: 'The full name of the certification or credential.',
      validation: (Rule) => Rule.required().error('Certificate title is required.'),
    }),
    defineField({
      name: 'issuer',
      title: 'Issuing Organization',
      type: 'string',
      description: 'The institution or authority that issued the certificate (e.g. Meta, AWS, Google).',
      validation: (Rule) => Rule.required().error('Issuing organization is required.'),
    }),
    defineField({
      name: 'issueDate',
      title: 'Issue Date',
      type: 'date',
      description: 'When the credential was awarded or issued.',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
    }),
    defineField({
      name: 'credentialId',
      title: 'Credential ID',
      type: 'string',
      description: 'Optional verification badge or license code.',
    }),
    defineField({
      name: 'credentialUrl',
      title: 'Credential URL',
      type: 'url',
      description: 'External link to verify or view the digital credential.',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'certificateImage',
      title: 'Certificate Image',
      type: 'image',
      description: 'High-resolution image preview of the certificate document or badge.',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Descriptive alt text for accessibility and SEO.',
        },
      ],
    }),
    defineField({
      name: 'certificatePdf',
      title: 'Certificate PDF',
      type: 'file',
      description: 'Optional downloadable PDF document.',
      options: {
        accept: '.pdf',
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Brief overview of competencies, honors, or project scope covered.',
    }),
    defineField({
      name: 'skills',
      title: 'Skills / Technologies',
      type: 'array',
      description: 'Key technologies and competencies validated by this credential.',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the 3D rotating wheel (1, 2, 3...). Lower numbers appear first.',
      initialValue: 0,
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'When unchecked, this certificate is hidden from the live website.',
      initialValue: true,
    }),
  ],

  orderings: [
    {
      title: 'Display Order, Ascending',
      name: 'orderAsc',
      by: [
        {field: 'order', direction: 'asc'},
        {field: 'issueDate', direction: 'desc'},
      ],
    },
    {
      title: 'Issue Date, Newest First',
      name: 'dateDesc',
      by: [{field: 'issueDate', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      issuer: 'issuer',
      media: 'certificateImage',
      date: 'issueDate',
      published: 'published',
      order: 'order',
    },
    prepare({title, issuer, media, date, published, order}) {
      const orderPrefix = typeof order === 'number' ? `[#${order}] ` : ''
      const statusSuffix = published === false ? ' (Unpublished)' : ''
      return {
        title: `${orderPrefix}${title || 'Untitled Certificate'}${statusSuffix}`,
        subtitle: [issuer, date].filter(Boolean).join(' • '),
        media,
      }
    },
  },
})
