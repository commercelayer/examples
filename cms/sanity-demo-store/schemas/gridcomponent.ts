import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const gridComponentType = defineType({
    type: 'document',
    name: 'gridComponent',
    title: 'Grid Component',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({
        name: 'items',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'gridItem'}]}],
        title: 'items',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'id'}},
  })