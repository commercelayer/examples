import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const taxonType = defineType({
    type: 'document',
    name: 'taxon',
    title: 'Taxon',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({
        name: 'label',
        type: 'internationalizedArrayString',
        title: 'label',
        hidden: false}),
      defineField({
        name: 'description',
        type: 'internationalizedArrayText',
        title: 'description',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'string',
        title: 'slug',
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
        name: 'references',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'product'}]}],
        title: 'references',
        hidden: false,
      }),
      defineField({
        name: 'taxons',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [
              {type: 'taxon'}
            ],
          },
        ],
        title: 'taxons',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'name'}},
  })