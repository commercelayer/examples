import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const gridItemType = defineType({
    type: 'document',
    name: 'gridItem',
    title: 'Item Component',
    description: '',
    fields: [
      defineField({name: 'title', type: 'string', title: 'title', hidden: false}),
      defineField({name: 'description', type: 'string', title: 'description', hidden: false}),
      defineField({name: 'image', type: 'image', title: 'image', hidden: false}),
      defineField({name: 'linkLabel', type: 'string', title: 'linkLabel', hidden: false}),
      defineField({name: 'linkHref', type: 'string', title: 'linkHref', hidden: false}),
    ],
    preview: {select: {title: 'title', media: 'image'}},
  })