import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const markdownComponentType = defineType({
    type: 'document',
    name: 'markdownComponent',
    title: 'Markdown Component',
    description: '',
    fields: [
      defineField({name: 'id', type: 'string', title: 'id', hidden: false}),
      defineField({
        name: 'content',
        type: 'markdown',
        title: 'content',
        hidden: false,
      }),
    ],
    preview: {select: {title: 'id'}},
  })