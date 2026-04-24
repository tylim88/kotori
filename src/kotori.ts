import type { BCP47LanguageTagName } from 'bcp47-language-tags'
import { useSyncExternalStore } from 'react'

export type Tags = BCP47LanguageTagName
export type SubTags = BCP47LanguageTagName extends `${infer SubTag}-${string}`
	? SubTag
	: never
export type AllTags = Tags | SubTags

export type ExtractVariables<T extends string> =
	T extends `${string}{{${infer P}}}${infer Q}`
		? P | ExtractVariables<Q>
		: never

export const kotori = <
	const PrimaryTag extends AllTags,
	const SecondaryTags extends Exclude<AllTags, PrimaryTag>,
>(props: {
	primaryLanguageTag: PrimaryTag
	secondaryLanguageTags: SecondaryTags[]
}) => {
	const listeners = new Set<() => void>()
	type WorkingTags = PrimaryTag | SecondaryTags
	let languageTag: WorkingTags = props.primaryLanguageTag

	return {
		dict: <
			const PrimaryString extends string,
			const SecondaryObject extends {
				[Key in SecondaryTags]: ExtractVariables<PrimaryString> extends infer PrimaryVariables
					? ExtractVariables<
							SecondaryObject[Key] & string
						> extends infer SecondaryVariables
						? PrimaryVariables[] extends SecondaryVariables[]
							? SecondaryVariables[] extends PrimaryVariables[]
								? SecondaryObject[Key]
								: 'variables not match!'
							: 'variables not match!!'
						: never
					: never
			},
		>(
			translation: { [Key in PrimaryTag]: PrimaryString } & SecondaryObject,
		) => translation,
		createTranslations: <
			const Dicts extends Record<string, Record<WorkingTags, string>>,
		>(
			dicts: Dicts,
		) => {
			return {
				useTranslations: useSyncExternalStore(
					(listener) => {
						listeners.add(listener)
						return () => listeners.delete(listener)
					},
					() => ({
						getLanguage: () => languageTag,
						setLanguage: (tag: WorkingTags) => {
							languageTag = tag
							listeners.forEach((listener) => {
								listener()
							})
						},
						t: <Key extends keyof Dicts>(
							key: Key,
							args: Record<ExtractVariables<Dicts[Key][WorkingTags]>, string>,
						) => {
							let locale =
								dicts[key]?.[languageTag] || 'error: translation not found'

							for (const objKey in args) {
								locale = locale.replace(
									/\{\{\s*(\w+)\s*\}\}/g,
									(_, key) => args[objKey as keyof typeof args] ?? `{{${key}}}`,
								)
							}
							return locale
						},
					}),
				),
			}
		},
	}
}
