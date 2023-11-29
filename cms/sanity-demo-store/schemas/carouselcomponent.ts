import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const carouselComponentType = defineType({
    type: 'document',
    name: 'carouselComponent',
    title: 'Carousel Component',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'Id', hidden: false}),
      defineField({
        name: 'slides',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'gridItem'}]}],
        title: 'Slides',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'id'}},
  })