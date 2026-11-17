import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'about',
  title: 'About Me',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
    }),
    defineField({
      name: 'role',
      title: 'Professional Title',
      type: 'string',
    }),
    defineField({
      name: 'shortBio',
      title: 'Short Introduction',
      type: 'text',
    }),
    defineField({
      name: 'fullBio',
      title: 'Detailed About Me',
      type: 'text',
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'github',
      title: 'GitHub URL',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'titleFirst',
      title: 'Split Title First Word (e.g. ABOUT)',
      type: 'string',
      initialValue: 'ABOUT',
    }),
    defineField({
      name: 'titleRest',
      title: 'Split Title Rest of Words (e.g. ME)',
      type: 'string',
      initialValue: 'ME',
    }),
    defineField({
      name: 'subtitle',
      title: 'Card Subtitle (e.g. BACKGROUND & VISION)',
      type: 'string',
      initialValue: 'BACKGROUND & VISION',
    }),
    defineField({
      name: 'scrollPrompt',
      title: 'Scroll Prompt (e.g. SCROLL TO EXPAND)',
      type: 'string',
      initialValue: 'SCROLL TO EXPAND',
    }),
    defineField({
      name: 'headline',
      title: 'Card Upper Headline',
      type: 'string',
    }),
    defineField({
      name: 'disciplines',
      title: 'Disciplines & Craft Line',
      type: 'string',
    }),
    defineField({
      name: 'disciplinesLabel',
      title: 'Disciplines Label (e.g. DISCIPLINE & CRAFT)',
      type: 'string',
      initialValue: 'DISCIPLINE & CRAFT',
    }),
    defineField({
      name: 'bgImage',
      title: 'Ambient Background Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'mediaImage',
      title: 'Center Artwork Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      initialValue: 'GET IN TOUCH',
    }),
    defineField({
      name: 'ctaLink',
      title: 'CTA Button Link or Action',
      type: 'string',
      initialValue: '#contact',
    }),
    defineField({
      name: 'secondaryCtaText',
      title: 'Secondary CTA Button Text',
      type: 'string',
      initialValue: 'SERVICES',
    }),
    defineField({
      name: 'secondaryCtaLink',
      title: 'Secondary CTA Button Link',
      type: 'string',
      initialValue: '#services',
    }),
    defineField({
      name: 'stage1Headline',
      title: 'Stage 01 Headline',
      type: 'string',
      initialValue: 'TURNING IDEAS INTO DISTINCTIVE DIGITAL EXPERIENCES.',
    }),
    defineField({
      name: 'stage2Headline',
      title: 'Stage 02 Headline',
      type: 'string',
      initialValue: "A CREATIVE MIND. A DEVELOPER'S APPROACH.",
    }),
    defineField({
      name: 'stage2Bio1',
      title: 'Stage 02 Description 1',
      type: 'text',
      initialValue:
        "I'M ABHISHEK — A CREATIVE DEVELOPER, DESIGN ENTHUSIAST AND CURRENTLY PURSUING MY BACHELOR OF COMPUTER APPLICATIONS (BCA) AT GRAPHIC ERA HILL UNIVERSITY, DEHRADUN.",
    }),
    defineField({
      name: 'stage2Bio2',
      title: 'Stage 02 Description 2',
      type: 'text',
      initialValue:
        "I'M PASSIONATE ABOUT EXPLORING TECHNOLOGY AND TURNING CREATIVE IDEAS INTO REAL-WORLD DIGITAL EXPERIENCES.",
    }),
    defineField({
      name: 'stage3Headline',
      title: 'Stage 03 Headline',
      type: 'string',
      initialValue: 'BUILT ON CURIOSITY. DRIVEN BY POSSIBILITY.',
    }),
    defineField({
      name: 'stage3Bio1',
      title: 'Stage 03 Description 1',
      type: 'text',
      initialValue: 'ALWAYS LEARNING. ALWAYS EXPERIMENTING. ALWAYS BUILDING.',
    }),
    defineField({
      name: 'stage3Bio2',
      title: 'Stage 03 Description 2',
      type: 'text',
      initialValue: 'THE JOURNEY HAS JUST BEGUN.',
    }),
  ],
})
