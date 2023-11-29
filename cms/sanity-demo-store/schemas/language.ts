import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const languageType = defineType({
  type: 'document',
  name: 'language',
  title: 'Language',
  description: '',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'name',
      hidden: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'code',
      type: 'string',
      title: 'code',
      hidden: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'catalog',
      type: 'reference',
      title: 'catalog',
      hidden: false,
      validation: (Rule) => Rule.required(),
      to: [{type: 'catalog'}],
    }),
  ],
  preview: {select: {title: 'name'}},
})