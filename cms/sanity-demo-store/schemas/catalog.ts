import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const catalogType = defineType({
  type: 'document',
  name: 'catalog',
  title: 'Catalog',
  description: '',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      title: 'id',
      hidden: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'name',
      hidden: false,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'taxonomies',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'taxonomy'}]}],
      title: 'taxonomies',
      hidden: false,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {select: {title: 'name'}},
})