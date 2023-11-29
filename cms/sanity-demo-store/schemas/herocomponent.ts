import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const heroComponentType = defineType({
    type: 'document',
    name: 'heroComponent',
    title: 'Hero Component',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({name: 'image', type: 'image', title: 'image', hidden: false}),
      defineField({name: 'title', type: 'string', title: 'title', hidden: false}),
      defineField({name: 'description', type: 'string', title: 'description', hidden: false}),
      defineField({name: 'href', type: 'string', title: 'href', hidden: false}),
    ],
    preview: {select: {title: 'id'}},
  })