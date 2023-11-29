import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const productGridComponentType = defineType({
    type: 'document',
    name: 'productGridComponent',
    title: 'Product Grid Component',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({name: 'title', type: 'string', title: 'title', hidden: false}),
      defineField({
        name: 'skus',
        type: 'array',
        of: [{type: 'string'}],
        title: 'skus',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'title'}},
  })