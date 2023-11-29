import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const localizedPageType = defineType({
    type: 'document',
    name: 'localizedPage',
    title: 'LocalizedPage',
    description: '',
    fields: [
      defineField({name: 'slug', type: 'string', title: 'slug', hidden: false}),
      defineField({
        name: 'localizedPages',
        type: 'internationalizedArrayLocalizedPages',
        title: 'Localized Pages',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'slug'}},
  })