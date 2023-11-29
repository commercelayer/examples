import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const countryType = defineType({
  type: 'document',
  name: 'country',
  title: 'Country',
  description: '',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'name',
      hidden: false,
      description: 'This is shown on the country selector page.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'code',
      type: 'string',
      title: 'code',
      hidden: false,
      description: 'Country code or region code.',
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .regex(/[A-Z]{2}/, {invert: false}),
    }),
    defineField({name: 'market', type: 'number', title: 'market', hidden: false}),
    defineField({
      name: 'catalog',
      type: 'reference',
      title: 'catalog',
      hidden: false,
      validation: (Rule) => Rule.required(),
      to: [{type: 'catalog'}],
    }),
    defineField({
      name: 'region',
      type: 'reference',
      title: 'region',
      hidden: false,
      validation: (Rule) => Rule.required(),
      to: [{type: 'region'}],
    }),
    defineField({
      name: 'languages',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'language'}]}],
      title: 'languages',
      hidden: false,
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {select: {title: 'name'}},
})