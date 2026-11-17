import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'resume',
  title: 'Resume',
  type: 'document',

  fields: [
    defineField({
      name: 'resumeFile',
      title: 'Resume PDF',
      type: 'file',
      description: 'Upload your resume PDF document here.',
      options: {
        accept: '.pdf',
      },
      validation: (Rule) => Rule.required().error('Please upload a resume PDF file.'),
    }),
  ],

  preview: {
    select: {
      fileName: 'resumeFile.asset.originalFilename',
    },
    prepare({fileName}) {
      return {
        title: 'Resume Document',
        subtitle: fileName ? `PDF: ${fileName}` : 'No PDF uploaded',
      }
    },
  },
})
