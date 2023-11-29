import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const productType = defineType({
    type: 'document',
    name: 'product',
    title: 'Product',
    description: '',
    options: {
        // show language filter for this document type, regardless of how documentTypes for the plugin is configured
        languageFilter: true,
    },
    fields: [
      defineField({
        name: 'name',
        type: 'internationalizedArrayString',
        title: 'Name',
        hidden: false,
        validation: (Rule) => Rule.required(),
      }),
      defineField({name: 'code', type: 'string', title: 'Code', hidden: false}),
      defineField({name: 'baseProductId', type: 'string', title: 'Base Product ID', hidden: false}),
      defineField({
        name: 'description',
        type: 'array',
        of: [{type: 'block'}, {type: 'image'}],
        title: 'Description',
        hidden: false,
      }),
      defineField({
        name: 'images',
        type: 'array',
        of: [{type: 'image'}],
        title: 'Images',
        hidden: false,
      }),
      defineField({
        name: 'skus',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'sku'}]}],
        title: 'SKUs',
        hidden: false,
      }),
      defineField({name: 'color', type: 'string', title: 'color', hidden: false}),
      defineField({name: 'size', type: 'string', title: 'size', hidden: false}),
    ],
    preview: {select: {title: 'name', code: 'code', images: 'images'},
        prepare(selection) {
        const {title, code, images } = selection
        return {
          title: title[0].value,
          subtitle: "Product Code = " + code,
          media: images[0]
        }
      }},
  })