import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const skuType = defineType({
    type: 'document',
    name: 'sku',
    title: 'SKU',
    description: '',
    fields: [
      defineField({
        name: 'code',
        type: 'string',
        title: 'Code',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'string',
        title: 'Slug',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
      defineField({name: 'size', type: 'string', title: 'Size', hidden: false}),
    ],
    preview: {select: {title: 'code'}},
  })