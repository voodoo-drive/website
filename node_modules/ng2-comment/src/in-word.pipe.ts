import { Pipe, PipeTransform } from '@angular/core';
/*
 * Convert number into a word such as 9 to 'nine'
 * 
 * Usage:
 *     number | in_word
 * Example:
 * 		let val = 9;
 *     {{ val | in_word }}
 *     results in: nine
 */
@Pipe({
	name: 'in_word'
})

export class InWordPipe implements PipeTransform {

	transform(numberr: number): string {

		let answer: string = '';

		switch(numberr) {
			case 1: answer = 'one'; break;
			case 2: answer = 'two'; break;
			case 3: answer = 'three'; break;
			case 4: answer = 'four'; break;
			case 5: answer = 'five'; break;
			case 6: answer = 'six'; break;
			case 7: answer = 'seven'; break;
			case 8: answer = 'eight'; break;
			case 9: answer = 'nine'; break;
			case 10: answer = 'ten'; break;
			default: answer = '';
		}
		return answer;

	}

}