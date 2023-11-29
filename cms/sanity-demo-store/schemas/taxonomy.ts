import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'


export const taxonomyType = defineType({
    type: 'document',
    name: 'taxonomy',
    title: 'Taxonomy',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({
        name: 'name',
        type: 'string',
        title: 'name',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
      defineField({name: 'facetKey', type: 'string', title: 'facetKey', hidden: false}),
      defineField({
        name: 'taxons',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'taxon'}]}],
        title: 'taxons',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
    ],
    preview: {select: {title: 'name'}},
  })
  