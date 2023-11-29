import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

export const organizationType = defineType({
  type: 'document',
  name: 'organization',
  title: 'Organization',
  description: '',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      hidden: false,
      description: 'The name of your organization',
    }),
    defineField({
      name: 'faviconUrl',
      type: 'string',
      title: 'Favicon URL',
      hidden: false,
      description: "Your brand's favicon image URL",
    }),
    defineField({
      name: 'logoUrl',
      type: 'string',
      title: 'Logo URL',
      hidden: false,
      description: "Your brand's logo image URL",
    }),
    defineField({
      name: 'primaryColor',
      type: 'string',
      title: 'Primary color',
      hidden: false,
      description: "Your brand's primary color HEX code",
    }),
    defineField({
      name: 'manifest',
      type: 'string',
      title: 'Manifest',
      hidden: false,
      description: 'A custom `manifest.json` URL',
    }),
  ],
  preview: {select: {title: 'name'}},
})