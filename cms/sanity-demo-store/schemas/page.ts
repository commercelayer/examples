import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const pageType = defineType({
    type: 'document',
    name: 'page',
    title: 'Page',
    description: '',
    fields: [
      defineField({
        name: 'displayName',
        type: 'string',
        title: 'Display name',
        hidden: false,
        description:
          'This text helps you to identify the page on Contentful. This is not used from the demo-store.',
        validation: (Rule) => Rule.required(),
      }),
      defineField({name: 'title', type: 'string', title: 'title', hidden: false}),
      defineField({name: 'description', type: 'string', title: 'description', hidden: false}),
      defineField({
        name: 'components',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [
              {type: 'carouselComponent'},
              {type: 'gridComponent'},
              {type: 'heroComponent'},
              {type: 'markdownComponent'},
              {type: 'productGridComponent'},
            ],
          },
        ],
        title: 'components',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'displayName'}},
  })